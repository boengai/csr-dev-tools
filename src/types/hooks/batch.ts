export type BatchAssetProgress = { current: number; total: number }

export type BatchAssetProgressReport = (current: number, total: number) => void

export type BatchAssetProcess<TResults> = (
  source: HTMLImageElement,
  report: BatchAssetProgressReport,
) => Promise<TResults>

export type UseBatchAssetPipelineOptions = {
  /** MIME allow-list for the file `<input accept>` attribute. */
  accept: string
  /**
   * Optional runtime gate beyond the input filter (e.g. `'image/'`). The
   * uploaded file's `type` must start with this prefix; otherwise the reject
   * toast fires and state is left untouched.
   */
  mimePrefix?: string
  /** Toast label when MIME validation rejects a file. */
  rejectToastLabel: string
  /** Toast label after a successful regenerate. Omit for no success toast. */
  successToastLabel?: string
  /** Toast label after a failed regenerate. */
  failureToastLabel: string
}

export type UseBatchAssetPipelineResult<TResults> = {
  sourceFile: File | null
  sourcePreview: string | null
  sourceImage: HTMLImageElement | null
  results: TResults | null
  pending: boolean
  progress: BatchAssetProgress | null
  error: unknown | null
  /**
   * Validate the first file's MIME (if `mimePrefix` is set), decode it via
   * `loadImageFromFile`, and populate `sourceFile`/`sourcePreview`/
   * `sourceImage`. Clears any previous results. A failed MIME check fires
   * the reject toast and leaves state untouched.
   */
  upload: (files: Array<File>) => Promise<void>
  /**
   * Run `process` against the current `sourceImage`. No-op if there is no
   * sourceImage. Drops the result of a stale call if a newer regenerate has
   * started since (same for `report()` calls from a stale session). Fires
   * the success or failure toast.
   */
  regenerate: (process: BatchAssetProcess<TResults>) => Promise<void>
  /** Download a single result blob. */
  downloadOne: (blob: Blob, filename: string) => void
  /**
   * Download all results as a single ZIP. Caller supplies the `{ path: content }`
   * map. Entry values may be `Blob` (binary) or `string` (text — written
   * verbatim, e.g. JSON manifests, HTML link tags).
   */
  downloadAll: (zipName: string, files: Record<string, Blob | string>) => Promise<void>
  /** Open the OS file picker, then route the selection through `upload()`. */
  openFilePicker: () => void
  /** Clear sourceFile, sourceImage, results, progress, error, pending. */
  reset: () => void
}
