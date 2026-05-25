import type { ReactNode } from 'react'

/**
 * Result shape produced by both `SortablePdfShell` adopters today
 * (`ImageToPdf`, `CombinePdf`). Fixed at this shape (not generic) per the
 * shell's invariant 2 — DownloadPdfButton + PdfBytesPreview share
 * `result.pdf`; a future adopter cannot wire them to different sources.
 *
 * See CONTEXT.md → "Sortable PDF shell".
 */
export type BytesPdfResult = {
  pdf: Uint8Array
  pageCount: number
  /**
   * File names rejected by the compute itself (distinct from
   * upload-time skips tracked by `useSortableItems.skipped`).
   * Today's adopters do not display this — present for future use.
   */
  skipped: Array<string>
}

export type SortablePdfShellRenderCardCtx<TItem> = {
  /** 1-based position in the current re-ordered items array. */
  position: number
  /** Wraps `useSortableItems.removeItem(item.id)` so per-card chrome can `onClick={onRemove}` without threading the id. */
  onRemove: () => void
  /** Wraps `useSortableItems.updateItem(item.id, partial)` for cards that mutate their own item (e.g. rotation). */
  update: (partial: Partial<TItem>) => void
}

export type SortablePdfShellRenderControlsCtx<TExtras> = {
  extras: TExtras
  /** Shallow-merge into the extras bag; triggers a pipeline recompute via the mirror effect. */
  setExtras: (partial: Partial<TExtras>) => void
  /** Current pipeline result — exposed so controls can derive things like size stats. */
  result: BytesPdfResult
}

export type SortablePdfShellProps<
  TItem extends { id: string },
  TExtras extends object = Record<string, never>,
> = {
  // ─── Dialog ─────────────────────────────────────────────────────────────
  autoOpen?: boolean
  description?: string
  onAfterDialogClose?: () => void
  /** Dialog title (e.g. "Image to PDF"). */
  title: string
  /** Trigger button(s) on the launch tile. Mirrors `<ToolDialogFrame>` triggers. */
  triggers: Array<{ label: string; onOpen?: () => void }>

  // ─── Upload + ingestion ────────────────────────────────────────────────
  /** `<UploadInput accept=...>` MIME pattern. */
  accept: string
  /** Filename regex applied before `onAcceptedFiles` — non-matching files route through `rejectFiles` automatically. */
  extensionRe: RegExp
  /** Upload button label, e.g. "Select PNG or JPEG images". */
  uploadButtonLabel: string
  /** Stable `<input name>` for the upload (used in spec + a11y). */
  uploadInputName: string
  /**
   * Called after extension filtering with the accepted subset. Helpers expose
   * the underlying `useSortableItems` bag for sync-push or async-expansion flows.
   *
   * - `ImageToPdf`: synchronously builds `Array<ImageItem>` and calls `addItems`.
   * - `CombinePdf`: kicks off async `readPdfPages` per file, with Tool-owned
   *    LoadingCard placeholders rendered via `renderExtraCards`.
   */
  onAcceptedFiles: (
    files: Array<File>,
    helpers: {
      addItems: (items: Array<TItem>) => void
      rejectFiles: (next: Array<string> | ((prev: Array<string>) => Array<string>)) => void
    },
  ) => void
  /**
   * Render non-sortable cards interleaved with the sortable grid (e.g.
   * CombinePdf's `<LoadingCard>` placeholders during async PDF page reads).
   * Mounted inside the `<SortableContext>` so siblings share the same grid
   * layout, but are NOT part of the sortable id list.
   */
  renderExtraCards?: () => ReactNode

  // ─── Per-card chrome ───────────────────────────────────────────────────
  /**
   * Render the sortable card for a single item. The shell wraps the result
   * in a `<Fragment key={item.id}>` so the caller's return value should NOT
   * carry its own `key`.
   */
  renderCard: (item: TItem, ctx: SortablePdfShellRenderCardCtx<TItem>) => ReactNode

  // ─── Compute ───────────────────────────────────────────────────────────
  /** Optional extras bag (e.g. ImageToPdf's `{ onePerPage: true }`). Empty `{}` by default. */
  initialExtras?: TExtras
  /** Async transform from items + extras to PDF bytes. Throws to surface the inline error banner. */
  compute: (items: Array<TItem>, extras: TExtras) => Promise<BytesPdfResult>

  // ─── Right pane ─────────────────────────────────────────────────────────
  /** Slug interpolated into the download filename: `csr-dev-tools_<slug>_<timestamp>.pdf`. Mirrors `<MarkupToPdfShell>`. */
  filenameSlug: string
  /** Optional controls slot in the right-pane top row, left of the download button (e.g. ImageToPdf's `onePerPage` checkbox). */
  renderControls?: (ctx: SortablePdfShellRenderControlsCtx<TExtras>) => ReactNode

  // ─── Lifecycle ─────────────────────────────────────────────────────────
  /** Optional per-Tool reset hook fired after the shell resets items + extras (e.g. CombinePdf clearing its `loading` state). */
  onReset?: () => void
}
