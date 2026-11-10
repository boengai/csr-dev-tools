import type { ReactElement, ReactNode } from 'react'

import type { BatchAssetProgressReport } from '@/types/hooks/batch'
import type { ToolComputeContext } from '@/types/hooks/computation'

/** How the shell names the files it handles, e.g. `{ one: 'image', other: 'images' }`. */
export type FileProcessorNoun = { one: string; other: string }

/** Props shared by both modes of `<FileProcessorShell>`. */
type FileProcessorBaseProps = {
  /** Open the dialog on mount (the tool route passes this). */
  autoOpen?: boolean
  /** Shown on the tile above its trigger button. */
  description?: string
  /** Dialog title — the Tool's name. */
  title: string
  /** The tile's single trigger, a short verb phrase (e.g. "Resize Images"), like the other shells. */
  triggerLabel: string
  /** Runs after the dialog closes (the shell has already returned to the upload area). */
  onAfterClose?: () => void

  /** `accept` for the file picker. Also the default `validate` (MIME types, `type/*` wildcards, `.ext`). */
  accept: string
  /**
   * The Tool's own file check (ADR-0016). Runs on picked and dropped files —
   * a drop bypasses `accept`. Defaults to matching `accept`.
   */
  validate?: (file: File) => boolean
  /** Toast when a picked or dropped file fails `validate`. Valid files in the same pick are still taken. */
  rejectToastLabel: string
  /** Label of the picker button inside the upload area. */
  uploadLabel: string
  /** Names the files in shell copy ("Choose another image", "3 images"). Defaults to file / files. */
  noun?: FileProcessorNoun
}

export type FileProcessorControlsContext<TControls> = {
  controls: TControls
  pending: boolean
  recompute: () => void
  setControls: (partial: Partial<TControls>) => void
}

export type FileProcessorPreviewContext<TControls> = FileProcessorControlsContext<TControls> & {
  error: unknown | null
  result: Blob | null
  resultUrl: string | null
  source: File
  sourceUrl: string
}

export type FileProcessorDownloadContext<TControls> = {
  controls: TControls
  result: Blob
  sourceName: string
}

/** One file in, one `Blob` out, recomputed live as the controls change. */
export type FileProcessorSingleProps<TControls extends object> = FileProcessorBaseProps & {
  multiple?: false
  /** The output form: one `Blob` with Download (the default). */
  output?: 'file'

  initialControls: TControls
  /**
   * Debounce re-processing after `setControls` by this many ms, for tools whose
   * `process` is heavy enough that a run per keystroke stalls typing. Uploads
   * and `recompute()` still process at once (call `recompute()` after a
   * programmatic `setControls`, e.g. seeding from `<img onLoad>`, to skip the
   * wait). Omit to process every change at once.
   */
  controlsDebounceMs?: number
  /**
   * Produce the result Blob, or null when the Tool has too little state yet
   * (e.g. no crop region). `context.signal` aborts when a newer file/controls
   * change supersedes this run, or on unmount. A rejection is shown in the
   * status slot and clears the result.
   */
  process: (file: File, controls: TControls, context: ToolComputeContext) => Promise<Blob | null>
  /** Status-slot text for a `process` rejection; always wins over the error's message. */
  errorLabel?: string
  /** Status-slot text for a rejection with no message. */
  errorFallback?: string

  renderControls: (ctx: FileProcessorControlsContext<TControls>) => ReactNode
  /** The input pane: the source and anything the user edits on it (e.g. a crop box). */
  renderSource: (ctx: FileProcessorPreviewContext<TControls>) => ReactNode
  /** The output pane, above the shell's Download button. Also covers the pending phase. */
  renderResult: (ctx: FileProcessorPreviewContext<TControls>) => ReactNode

  getDownloadFilename: (ctx: FileProcessorDownloadContext<TControls>) => string
}

/** Decoded size of a queued source image (0 × 0 when the browser could not decode it). */
export type FileProcessorSourceMeta = { height: number; width: number }

export type FileProcessorItem = FileProcessorSourceMeta & {
  file: File
  /** Stable per-upload id — two picks of the same file still get distinct rows. */
  id: string
}

export type FileProcessorOutput = {
  blob: Blob
  /** Output size when the Tool knows it; omitted → the row shows no dimensions. */
  height?: number
  width?: number
}

export type FileProcessorResult =
  | (FileProcessorOutput & { id: string; name: string; source: FileProcessorItem; status: 'done' })
  | { error: string; id: string; source: FileProcessorItem; status: 'failed' }

export type FileProcessorBatchStep = 'processing' | 'queue' | 'results'

/** Many files in, one `Blob` out per file: queue → Process → per-file results + ZIP. */
export type FileProcessorBatchProps = FileProcessorBaseProps & {
  multiple: true
  /** Batch output is always one `Blob` per file. */
  output?: never

  /** Toast when every file in a run fails. */
  failureToastLabel: string
  /** The Process button, e.g. "Convert" / "Resize". */
  actionLabel: string
  actionIcon: ReactElement<SVGElement>
  /** Caption over the output side of the preview, e.g. "Resized". Defaults to "Result". */
  resultLabel?: string
  /** False disables Process and the live preview (e.g. no target size entered yet). Defaults to true. */
  canProcess?: boolean
  /** Controls row, owned and stored by the Tool. */
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
  process: (file: File, meta: FileProcessorSourceMeta) => Promise<FileProcessorOutput>
  /** Download name for one output; the shell dedupes collisions within a run. */
  getOutputName: (file: File) => string
  /** ZIP name stem for "Download ZIP"; the shell appends a timestamp. */
  zipPrefix: string
}

/** One downloadable file of an `assets` result, shown as a card that downloads it. */
export type FileProcessorAsset = {
  blob: Blob
  /** First line under the thumbnail, e.g. "32x32" or a device name. */
  caption: string
  /** Further lines under the caption, e.g. ["1170x2532", "portrait"]. */
  details?: Array<string>
  /** Download name of this file. */
  name: string
  /** Path inside the ZIP (e.g. `icons/maskable/x.png`). Defaults to `name`. */
  zipPath?: string
}

/** A titled set of assets. Several groups render as tabs; one renders as a plain grid. */
export type FileProcessorAssetGroup = { assets: Array<FileProcessorAsset>; label: string }

/** A labelled, read-only block of text with Copy in its label. */
export type FileProcessorTextOutput = {
  /** Shown after the label (e.g. a size); not part of the Copy button's name. */
  details?: string
  label: string
  value: string
  /** `assets` output only: also write this text into the ZIP at this path. */
  zipPath?: string
}

/** `assets` output: files to download one by one or as a ZIP, plus optional copyable text next to them. */
export type FileProcessorAssetsResult = {
  assetGroups: Array<FileProcessorAssetGroup>
  textOutputs?: Array<FileProcessorTextOutput>
}

/** `text` output: copyable text blocks only, no download. */
export type FileProcessorTextResult = { textOutputs: Array<FileProcessorTextOutput> }

export type FileProcessorDerivedResult = FileProcessorAssetsResult | FileProcessorTextResult

/** What a derived-output `process` gets: the source (decoded once when added) and the controls. */
export type FileProcessorDerivedInput<TControls> = {
  controls: TControls
  file: File
  image: HTMLImageElement
  /** Report `current` of `total` steps; the shell shows it beside `pendingLabel`. */
  report: BatchAssetProgressReport
}

/** Render-prop context of the input pane in a derived-output mode. */
export type FileProcessorSourceContext<TControls> = FileProcessorControlsContext<TControls> & {
  /** The source, decoded once when it was added (natural size, drawing). */
  image: HTMLImageElement
  source: File
  sourceUrl: string
}

/**
 * One image in, a set of outputs derived from it (`assets` or `text`). The
 * source is decoded once when it is added (ADR-0025's resamplers draw it to
 * many sizes).
 */
type FileProcessorDerivedBaseProps<TControls extends object, TResult> = FileProcessorBaseProps & {
  multiple?: false

  /** Controls bag; omit for a Tool with no controls. Reset to this when the dialog closes. */
  initialControls?: TControls
  renderControls?: (ctx: FileProcessorControlsContext<TControls>) => ReactNode
  /** The input pane: the source and any live preview of the controls. */
  renderSource: (ctx: FileProcessorSourceContext<TControls>) => ReactNode

  /**
   * Produce the outputs. A rejection shows in the status slot and hides the
   * outputs; it never toasts. A file the browser cannot decode never gets
   * here — it toasts `rejectToastLabel`.
   */
  process: (input: FileProcessorDerivedInput<TControls>) => Promise<TResult>
  /**
   * Set for slow work: a Process button with this label sits under the input,
   * and the shell runs only when it is pressed. Omit to run as soon as a file
   * is added and on every control change.
   */
  actionLabel?: string
  /** Shown while `process` runs (on the Process button, or in the output), e.g. "Generating…". */
  pendingLabel: string
  /** The output's empty state, phrased as an instruction. */
  placeholder: string
  /** Status-slot text for a `process` rejection; always wins over the error's message. */
  errorLabel?: string
  /** Status-slot text for a rejection with no message. */
  errorFallback?: string
}

/** One image in, many files out: a card per asset (Download each) and Download ZIP at the bottom. */
export type FileProcessorAssetsProps<TControls extends object> = FileProcessorDerivedBaseProps<
  TControls,
  FileProcessorAssetsResult
> & {
  output: 'assets'
  /** ZIP name stem for "Download ZIP"; the shell appends a timestamp. */
  zipPrefix: string
}

/** One image in, labelled text blocks out, each with Copy in its label. No download. */
export type FileProcessorTextProps<TControls extends object> = FileProcessorDerivedBaseProps<
  TControls,
  FileProcessorTextResult
> & {
  output: 'text'
}

export type FileProcessorDerivedProps<TControls extends object> =
  | FileProcessorAssetsProps<TControls>
  | FileProcessorTextProps<TControls>

export type FileProcessorShellProps<TControls extends object> =
  | FileProcessorAssetsProps<TControls>
  | FileProcessorBatchProps
  | FileProcessorSingleProps<TControls>
  | FileProcessorTextProps<TControls>

export type FileProcessorAssetCardProps = { asset: FileProcessorAsset }

export type FileProcessorAssetGridProps = { assets: Array<FileProcessorAsset> }

export type FileProcessorAssetGroupsProps = { groups: Array<FileProcessorAssetGroup> }

export type FileProcessorTextOutputsProps = { outputs: Array<FileProcessorTextOutput> }

export type FileProcessorUploadAreaProps = {
  accept: string
  label: string
  multiple: boolean
  /** Name of the hidden file input (e2e and specs target it). */
  name: string
  noun: FileProcessorNoun
  onFiles: (files: Array<File>) => void
}

export type FileProcessorThumbnailProps = {
  alt: string
  blob: Blob
  /** `row` is the list thumbnail; `preview` fills the single-image before/after panel; `asset` sits on an asset card. */
  variant: 'asset' | 'preview' | 'row'
}

/** Live-preview pipeline input: the previewed item plus the Tool's settings key. */
export type FileProcessorPreviewInput = { item: FileProcessorItem | null; key: string }

/** Internal pipeline input of the single-file mode: the source file plus the shell-owned controls bag. */
export type FileProcessorPipelineInput<TControls> = {
  controls: TControls
  file: File | null
}

/** One side of the big Original | Result comparison. */
export type FileProcessorComparePane = {
  /** Image to show; null renders `status` (or nothing) in its place. */
  blob: Blob | null
  caption: string
  /** Line under the image, e.g. "photo.jpg · 800 × 600 · 120 KB". */
  details?: string
  /** Shown instead of the image (hint), or under the caption while updating. */
  status?: ReactNode
  /** Dims the image while a newer render is on its way. */
  stale?: boolean
}

export type FileProcessorComparePaneProps = {
  altText: string
  pane: FileProcessorComparePane
}

export type FileProcessorCompareProps = {
  busy?: boolean
  label: string
  original: FileProcessorComparePane
  result: FileProcessorComparePane
}

/** The fixed layout both modes render into: input pane left, output pane right. */
export type FileProcessorWorkAreaProps = {
  input: ReactNode
  /** Under the input: the button that creates output (Process) or brings more input. */
  inputFooter?: ReactNode
  output: ReactNode
  /** Bottom of the output pane: the buttons that take the output away (Download). */
  outputFooter?: ReactNode
  /** `split`: two equal panes (single file). `rail`: a narrow list column beside a wide output (batch). */
  variant: 'rail' | 'split'
}
