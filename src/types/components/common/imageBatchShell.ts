import type { ReactElement, ReactNode } from 'react'

/** Decoded size of a queued source image (0 × 0 when the browser could not decode it). */
export type ImageBatchSourceMeta = { height: number; width: number }

export type ImageBatchItem = ImageBatchSourceMeta & {
  file: File
  /** Stable per-upload id — two picks of the same file still get distinct rows. */
  id: string
}

export type ImageBatchOutput = {
  blob: Blob
  /** Output size when the Tool knows it; omitted → the row shows no dimensions. */
  height?: number
  width?: number
}

export type ImageBatchResult =
  | (ImageBatchOutput & { id: string; name: string; source: ImageBatchItem; status: 'done' })
  | { error: string; id: string; source: ImageBatchItem; status: 'failed' }

export type ImageBatchStep = 'processing' | 'queue' | 'results'

export type ImageBatchShellProps = {
  description?: string
  /** Title of the full-screen dialog the workspace opens in. */
  title: string
  /** Runs after the dialog closes (the shell has already cleared its queue). */
  onAfterClose?: () => void

  accept: string
  /** Upload button label on the page tile; must match `/select/i` for the e2e smoke test. */
  uploadLabel: string
  /** Toast when a picked file is not an image. Invalid files are skipped, valid ones are still queued. */
  rejectToastLabel: string
  /** Toast when every file in a run fails. */
  failureToastLabel: string

  /** The run button, e.g. "Convert" / "Resize". */
  actionLabel: string
  /** Caption over the output side of the preview, e.g. "Resized". Defaults to "Result". */
  resultLabel?: string
  actionIcon: ReactElement<SVGElement>
  /** False disables the run button and the live preview (e.g. no target size entered yet). Defaults to true. */
  canProcess?: boolean
  /** Settings row shown under the queue, owned and stored by the Tool. */
  settings: ReactNode
  /**
   * Any value that changes whenever the settings do (e.g. `JSON.stringify(settings)`).
   * Settings live in the Tool, so this is how the shell knows to re-render the live preview.
   */
  previewKey: string

  /**
   * Produce one output. A run calls it once per queued file, in order; a throw
   * marks only that file as failed — the rest of the batch still runs. The live
   * preview also calls it (debounced) for the previewed file on every settings change.
   */
  process: (file: File, meta: ImageBatchSourceMeta) => Promise<ImageBatchOutput>
  /** Download name for one output; the shell dedupes collisions within a run. */
  getOutputName: (file: File) => string
  /** ZIP name stem for "Download ZIP"; the shell appends a timestamp. */
  zipPrefix: string
}

export type ImageBatchThumbnailProps = {
  alt: string
  blob: Blob
  /** `row` is the list thumbnail; `preview` fills the single-image before/after panel. */
  variant: 'preview' | 'row'
}

/** Live-preview pipeline input: the previewed item plus the Tool's settings key. */
export type ImageBatchPreviewInput = { item: ImageBatchItem | null; key: string }

/** One side of the big Original | Result comparison. */
export type ImageBatchComparePane = {
  /** Image to show; null renders `status` (or nothing) in its place. */
  blob: Blob | null
  caption: string
  /** Line under the image, e.g. "photo.jpg · 800 × 600 · 120 KB". */
  details?: string
  /** Shown instead of the image (hint, error), or under the caption while updating. */
  status?: ReactNode
  /** Dims the image while a newer render is on its way. */
  stale?: boolean
}

export type ImageBatchCompareProps = {
  busy?: boolean
  label: string
  original: ImageBatchComparePane
  result: ImageBatchComparePane
}
