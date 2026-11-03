import { useEffect, useRef, useState } from 'react'

import { useToast } from '@/hooks/state/useToast'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { useStaleSafeAsync } from '@/hooks/useStaleSafeAsync'
import { useToolComputation } from '@/hooks/useToolComputation'
import type {
  ImageBatchComparePane,
  ImageBatchCompareProps,
  ImageBatchItem,
  ImageBatchOutput,
  ImageBatchPreviewInput,
  ImageBatchResult,
  ImageBatchShellProps,
  ImageBatchStep,
  ImageBatchThumbnailProps,
  StaleSafeSession,
} from '@/types'
import { downloadBlob } from '@/utils/download'
import { dedupeFileName, formatFileSize } from '@/utils/file'
import { loadImageFromBlob } from '@/utils/image'
import { buildZipBlob } from '@/utils/zip'

import { Button } from '../button'
import { UploadDialogFrame } from '../dialog/UploadDialogFrame'
import { NotoEmoji } from '../emoji'
import { ArrowIcon, DownloadIcon, RefreshIcon, XIcon } from '../icon'
import { UploadInput } from '../input/UploadInput'
import { ProgressBar } from '../progress-bar'

const BatchThumbnail = ({ alt, blob, variant }: ImageBatchThumbnailProps) => {
  const url = useBlobUrl(blob)
  if (variant === 'row') {
    return url ? (
      <img alt={alt} className="size-15 shrink-0 rounded-sm object-cover" src={url} />
    ) : (
      <div className="size-15 shrink-0 rounded-sm bg-gray-800" />
    )
  }
  return url ? <img alt={alt} className="max-h-[30vh] max-w-full object-contain tablet:max-h-full" src={url} /> : null
}

const ComparePane = ({ altText, pane }: { altText: string; pane: ImageBatchComparePane }) => (
  <figure className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-3 p-4">
    <figcaption className="shrink-0 text-body-sm font-medium text-gray-300">{pane.caption}</figcaption>
    <div className="flex min-h-0 w-full grow items-center justify-center">
      {pane.blob ? (
        <div
          className={`flex size-full items-center justify-center transition-opacity ${pane.stale ? 'opacity-50' : ''}`}
        >
          <BatchThumbnail alt={altText} blob={pane.blob} variant="preview" />
        </div>
      ) : (
        pane.status
      )}
    </div>
    {pane.details && <span className="shrink-0 text-center text-body-xs text-gray-500">{pane.details}</span>}
  </figure>
)

/** The big side-by-side comparison: Original ┊ Result, filling the dialog's free space on tablet+. */
const BatchCompare = ({ busy, label, original, result }: ImageBatchCompareProps) => (
  <section
    aria-busy={busy}
    aria-label={label}
    className="bg-grid-texture flex shrink-0 flex-col rounded-sm bg-black tablet:min-h-0 tablet:min-w-0 tablet:shrink tablet:grow tablet:flex-row"
  >
    <ComparePane altText="original" pane={original} />
    <div className="h-0 w-full shrink-0 border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-0 tablet:border-t-0 tablet:border-l-2" />
    <ComparePane altText="result" pane={result} />
  </section>
)

/** Debounce for preview re-renders while typing; selecting another image previews at once. */
const PREVIEW_DEBOUNCE_MS = 250

const describeError = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Could not process this image'

const formatDimensions = (width?: number, height?: number) => (width && height ? `${width} × ${height}` : null)

const mintZipName = (prefix: string) => `csr-dev-tools_${prefix}_${Date.now()}.zip`

const joinDetails = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join(' · ')

const readSize = async (file: File) => {
  try {
    const img = await loadImageFromBlob(file)
    return { height: img.naturalHeight, width: img.naturalWidth }
  } catch {
    // Undecodable files stay queued; `process` will fail them individually.
    return { height: 0, width: 0 }
  }
}

/**
 * Many-files-in / many-Blobs-out image Tool: import → queue (add / remove,
 * Tool-owned settings) → processing → per-file results with individual and
 * ZIP downloads. A file that fails to process is listed, not fatal.
 * See CONTEXT.md → "Image batch shell".
 */
export const ImageBatchShell = ({
  accept,
  actionIcon,
  actionLabel,
  canProcess = true,
  description,
  failureToastLabel,
  getOutputName,
  onAfterClose,
  previewKey,
  process,
  rejectToastLabel,
  resultLabel = 'Result',
  settings,
  title,
  uploadLabel,
  zipPrefix,
}: ImageBatchShellProps) => {
  const showError = useToast((s) => s.showError)
  // One session per run; reset/unmount bumps it so a stale run stops after its next await.
  const newSession = useStaleSafeAsync()
  // Separate counter for size reads, so a reset drops sizes still being decoded.
  const newQueueSession = useStaleSafeAsync()
  useEffect(
    () => () => {
      newSession()
      newQueueSession()
    },
    [newQueueSession, newSession],
  )

  const nextIdRef = useRef(0)
  const queueSessionRef = useRef<StaleSafeSession | null>(null)
  const [step, setStep] = useState<ImageBatchStep>('queue')
  const [items, setItems] = useState<Array<ImageBatchItem>>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState<Array<ImageBatchResult>>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  // Live preview of one queued image (the clicked row, else the first) with the current settings.
  const previewItem = items.find((it) => it.id === selectedId) ?? items[0] ?? null
  const preview = useToolComputation<ImageBatchPreviewInput, ImageBatchOutput | null>(
    ({ item }) => (item ? process(item.file, { height: item.height, width: item.width }) : null),
    {
      debounceMs: PREVIEW_DEBOUNCE_MS,
      initial: null,
      isEmpty: ({ item }) => !item,
      // The panel shows the failure inline; a toast per keystroke would be noise.
      onError: () => undefined,
    },
  )
  const { setInput: setPreviewInput, setInputImmediate: setPreviewInputImmediate } = preview
  const previewTarget = step === 'queue' && canProcess ? previewItem : null
  const lastPreviewIdRef = useRef<string | null>(null)
  // Settings live in the Tool, so `previewKey` is the only signal that they changed.
  // A new image previews at once; a settings change waits out the debounce.
  useEffect(() => {
    const id = previewTarget?.id ?? null
    const input = { item: previewTarget, key: previewKey }
    if (id !== lastPreviewIdRef.current) setPreviewInputImmediate(input)
    else setPreviewInput(input)
    lastPreviewIdRef.current = id
    // Width/height join the deps so the converter's dimensions fill in once the size read lands.
  }, [
    previewKey,
    previewTarget,
    previewTarget?.height,
    previewTarget?.width,
    setPreviewInput,
    setPreviewInputImmediate,
  ])

  /** Queue the image files among `files`; returns whether any were added. */
  const handleAdd = (files: Array<File>): boolean => {
    const valid = files.filter((f) => f.type.startsWith('image/'))
    if (valid.length < files.length) showError(rejectToastLabel)
    if (valid.length === 0) return false

    const added = valid.map((file) => ({ file, height: 0, id: `img-${nextIdRef.current++}`, width: 0 }))
    setItems((prev) => [...prev, ...added])
    setStep('queue')

    // Shared by every add until a reset — adding more files must not drop sizes still being read.
    queueSessionRef.current ??= newQueueSession()
    const session = queueSessionRef.current
    for (const item of added) {
      void readSize(item.file).then((size) => {
        if (!session.isFresh()) return
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...size } : it)))
      })
    }
    return true
  }

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleReset = () => {
    newSession()
    queueSessionRef.current = newQueueSession()
    setItems([])
    setResults([])
    setSelectedId(null)
    setSelectedResultId(null)
    setStep('queue')
  }

  const handleRun = async () => {
    if (items.length === 0 || !canProcess) return
    const session = newSession()
    const queue = items
    setResults([])
    setProgress({ done: 0, total: queue.length })
    setStep('processing')

    const out: Array<ImageBatchResult> = []
    const taken = new Set<string>()
    for (const item of queue) {
      try {
        const output = await process(item.file, { height: item.height, width: item.width })
        if (!session.isFresh()) return
        // Two inputs can share a base name — keep both instead of overwriting.
        const name = dedupeFileName(getOutputName(item.file), (n) => taken.has(n))
        taken.add(name)
        out.push({ ...output, id: item.id, name, source: item, status: 'done' })
      } catch (err) {
        if (!session.isFresh()) return
        out.push({
          error: describeError(err),
          id: item.id,
          source: item,
          status: 'failed',
        })
      }
      setProgress({ done: out.length, total: queue.length })
    }

    if (out.every((r) => r.status === 'failed')) {
      showError(failureToastLabel)
      setStep('queue')
      return
    }
    setResults(out)
    setSelectedResultId(null)
    setStep('results')
  }

  const doneResults = results.filter((r) => r.status === 'done')

  const handleDownloadAll = async () => {
    const files: Record<string, Blob> = {}
    for (const r of doneResults) files[r.name] = r.blob
    const session = newSession()
    const zip = await buildZipBlob(files)
    if (!session.isFresh()) return
    downloadBlob(zip, mintZipName(zipPrefix))
  }

  const shownResult = doneResults.find((r) => r.id === selectedResultId) ?? doneResults[0]

  const countLabel = `${items.length} ${items.length === 1 ? 'image' : 'images'}`

  return (
    <UploadDialogFrame
      accept={accept}
      buttonLabel={uploadLabel}
      description={description}
      multiple
      onAfterClose={onAfterClose}
      onReset={handleReset}
      onUpload={(files, openDialog) => {
        if (handleAdd(files)) openDialog()
      }}
      size="screen"
      title={title}
      uploadInputName="images"
    >
      {step === 'queue' && items.length === 0 && (
        <div className="flex grow flex-col items-center justify-center gap-4">
          <p className="text-body-sm text-gray-400">No images selected.</p>
          <div className="w-full tablet:w-96">
            <UploadInput
              accept={accept}
              button={{ block: true, children: 'Add images' }}
              multiple
              name="images-add"
              onChange={handleAdd}
            />
          </div>
        </div>
      )}

      {step === 'queue' && items.length > 0 && (
        <div className="flex grow flex-col gap-4 tablet:min-h-0">
          <div className="flex w-full shrink-0 flex-col gap-2">{settings}</div>

          <div className="flex grow flex-col gap-4 tablet:min-h-0 tablet:flex-row">
            {previewItem && (
              <BatchCompare
                busy={preview.isPending}
                label="Live preview"
                original={{
                  blob: previewItem.file,
                  caption: 'Original',
                  details: joinDetails(
                    previewItem.file.name,
                    formatDimensions(previewItem.width, previewItem.height),
                    formatFileSize(previewItem.file.size),
                  ),
                }}
                result={{
                  blob: canProcess && !preview.error ? (preview.result?.blob ?? null) : null,
                  caption: preview.isPending && canProcess ? `${resultLabel} · updating…` : resultLabel,
                  details:
                    canProcess && !preview.error && preview.result
                      ? joinDetails(
                          formatDimensions(preview.result.width, preview.result.height),
                          formatFileSize(preview.result.blob.size),
                        )
                      : undefined,
                  stale: preview.isPending,
                  status: !canProcess ? (
                    <p className="text-center text-body-xs text-gray-500">Choose the options above to see a preview.</p>
                  ) : preview.error ? (
                    <p className="text-center text-body-xs text-error">
                      Preview failed: {describeError(preview.error)}
                    </p>
                  ) : null,
                }}
              />
            )}

            <aside className="flex shrink-0 flex-col gap-2 tablet:order-first tablet:min-h-0 tablet:w-72">
              <p className="shrink-0 text-body-sm text-gray-400">{countLabel}</p>
              <ul
                aria-label="Selected images"
                className="flex gap-2 overflow-x-auto p-1 tablet:min-h-0 tablet:grow tablet:flex-col tablet:overflow-x-hidden tablet:overflow-y-auto"
              >
                {items.map((item) => {
                  const selected = item.id === previewItem?.id
                  return (
                    <li className="relative w-56 shrink-0 tablet:w-full" key={item.id}>
                      <button
                        aria-label={`Preview ${item.file.name}`}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-2 rounded-sm border p-1 pr-7 text-left transition-colors ${
                          selected ? 'border-primary bg-gray-900' : 'border-gray-800 hover:bg-gray-900'
                        }`}
                        onClick={() => setSelectedId(item.id)}
                        type="button"
                      >
                        <BatchThumbnail alt={item.file.name} blob={item.file} variant="row" />
                        <span className="flex min-w-0 grow flex-col">
                          <span className="truncate text-body-sm text-gray-300">{item.file.name}</span>
                          <span className="truncate text-body-xs text-gray-500">
                            {joinDetails(formatDimensions(item.width, item.height), formatFileSize(item.file.size))}
                          </span>
                        </span>
                      </button>
                      <button
                        aria-label={`Remove ${item.file.name}`}
                        className="absolute top-1 right-1 rounded-full p-1 text-gray-400 transition-colors hover:bg-error hover:text-white"
                        onClick={() => handleRemove(item.id)}
                        type="button"
                      >
                        <XIcon size={12} />
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="shrink-0">
                <UploadInput
                  accept={accept}
                  button={{ block: true, children: 'Add more images' }}
                  multiple
                  name="images-add"
                  onChange={handleAdd}
                />
              </div>
            </aside>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2">
            <div>
              <Button block icon={<RefreshIcon />} onClick={handleReset}>
                Start over
              </Button>
            </div>
            <div>
              <Button block disabled={!canProcess} icon={actionIcon} onClick={handleRun} variant="primary">
                {items.length > 1 ? `${actionLabel} ${items.length} images` : actionLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div aria-live="polite" className="flex w-full grow flex-col items-center justify-center gap-6">
          <NotoEmoji emoji="robot" size={120} />
          <div className="flex w-full flex-col items-center gap-2 desktop:w-8/10">
            <ProgressBar value={progress.total ? (progress.done / progress.total) * 100 : 0} />
            <span className="text-body-sm text-gray-400">
              {progress.done} of {progress.total}
            </span>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex grow flex-col gap-4 tablet:min-h-0">
          <p aria-live="polite" className="shrink-0 text-body-sm text-gray-300">
            {doneResults.length} of {results.length} {results.length === 1 ? 'image' : 'images'} ready
            {doneResults.length < results.length ? ` · ${results.length - doneResults.length} failed` : ''}
          </p>

          <div className="flex grow flex-col gap-4 tablet:min-h-0 tablet:flex-row">
            {shownResult && (
              <BatchCompare
                label="Before and after"
                original={{
                  blob: shownResult.source.file,
                  caption: 'Original',
                  details: joinDetails(
                    shownResult.source.file.name,
                    formatDimensions(shownResult.source.width, shownResult.source.height),
                    formatFileSize(shownResult.source.file.size),
                  ),
                }}
                result={{
                  blob: shownResult.blob,
                  caption: resultLabel,
                  details: joinDetails(
                    shownResult.name,
                    formatDimensions(shownResult.width, shownResult.height),
                    formatFileSize(shownResult.blob.size),
                  ),
                }}
              />
            )}

            <aside className="flex shrink-0 flex-col gap-2 tablet:order-first tablet:min-h-0 tablet:w-72">
              <ul
                aria-label="Results"
                className="flex gap-2 overflow-x-auto p-1 tablet:min-h-0 tablet:grow tablet:flex-col tablet:overflow-x-hidden tablet:overflow-y-auto"
              >
                {results.map((r) =>
                  r.status === 'done' ? (
                    <li className="flex w-64 shrink-0 items-center gap-1 tablet:w-full" key={r.id}>
                      <button
                        aria-label={`Compare ${r.source.file.name}`}
                        aria-pressed={r.id === shownResult?.id}
                        className={`flex min-w-0 grow items-center gap-2 rounded-sm border p-1 text-left transition-colors ${
                          r.id === shownResult?.id ? 'border-primary bg-gray-900' : 'border-gray-800 hover:bg-gray-900'
                        }`}
                        onClick={() => setSelectedResultId(r.id)}
                        type="button"
                      >
                        <BatchThumbnail alt={r.name} blob={r.blob} variant="row" />
                        <span className="flex min-w-0 grow flex-col">
                          <span className="truncate text-body-sm text-gray-300">{r.source.file.name}</span>
                          <span className="truncate text-body-xs text-gray-500">
                            {joinDetails(
                              formatDimensions(r.width, r.height),
                              `${formatFileSize(r.source.file.size)} → ${formatFileSize(r.blob.size)}`,
                            )}
                          </span>
                        </span>
                      </button>
                      <div className="shrink-0">
                        <Button
                          aria-label={`Download ${r.name}`}
                          icon={<DownloadIcon />}
                          onClick={() => downloadBlob(r.blob, r.name)}
                          size="small"
                        />
                      </div>
                    </li>
                  ) : (
                    <li
                      className="flex w-64 shrink-0 items-center gap-2 rounded-sm border border-gray-800 p-1 tablet:w-full"
                      key={r.id}
                    >
                      <div className="size-15 shrink-0 rounded-sm bg-gray-800" />
                      <span className="flex min-w-0 grow flex-col">
                        <span className="truncate text-body-sm text-gray-300">{r.source.file.name}</span>
                        <span className="text-body-xs text-error">Failed: {r.error}</span>
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </aside>
          </div>

          <div
            className={`grid w-full shrink-0 grid-cols-1 gap-2 ${doneResults.length > 1 ? 'tablet:grid-cols-3' : 'tablet:grid-cols-2'}`}
          >
            {doneResults.length > 1 && (
              <div>
                <Button block icon={<DownloadIcon />} onClick={handleDownloadAll} variant="primary">
                  Download ZIP
                </Button>
              </div>
            )}
            {doneResults.length === 1 && (
              <div>
                <Button
                  block
                  icon={<DownloadIcon />}
                  onClick={() => shownResult && downloadBlob(shownResult.blob, shownResult.name)}
                  variant="primary"
                >
                  Download
                </Button>
              </div>
            )}
            <div>
              <Button block icon={<ArrowIcon />} onClick={() => setStep('queue')}>
                Change settings
              </Button>
            </div>
            <div>
              <Button block icon={<RefreshIcon />} onClick={handleReset}>
                Start over
              </Button>
            </div>
          </div>
        </div>
      )}
    </UploadDialogFrame>
  )
}
