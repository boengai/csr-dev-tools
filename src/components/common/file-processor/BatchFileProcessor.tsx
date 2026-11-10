import { useEffect, useRef, useState } from 'react'

import { useToast } from '@/hooks/state/useToast'
import { useStaleSafeAsync } from '@/hooks/useStaleSafeAsync'
import { useToolComputation } from '@/hooks/useToolComputation'
import type {
  FileProcessorBatchProps,
  FileProcessorBatchStep,
  FileProcessorItem,
  FileProcessorOutput,
  FileProcessorPreviewInput,
  FileProcessorResult,
  StaleSafeSession,
} from '@/types'
import { downloadBlob } from '@/utils/download'
import { dedupeFileName, formatFileSize, matchesAccept } from '@/utils/file'
import { loadImageFromBlob } from '@/utils/image'
import { buildZipBlob } from '@/utils/zip'

import { ToolStatus } from '../banner'
import { Button, ModEnterAction } from '../button'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { NotoEmoji } from '../emoji'
import { ArrowIcon, DownloadIcon, XIcon } from '../icon'
import { UploadInput } from '../input/UploadInput'
import { ProgressBar } from '../progress-bar'
import {
  countLabel,
  DEFAULT_NOUN,
  FileCompare,
  FileProcessorWorkArea,
  FileThumbnail,
  FileUploadArea,
  mintZipName,
} from './FileProcessorParts'

/** Debounce for preview re-renders while typing; selecting another file previews at once. */
const PREVIEW_DEBOUNCE_MS = 250

const describeError = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Could not process this file'

const formatDimensions = (width?: number, height?: number) => (width && height ? `${width} × ${height}` : null)

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

const ROW_LIST =
  'flex gap-2 overflow-x-auto p-1 tablet:min-h-0 tablet:grow tablet:flex-col tablet:overflow-x-hidden tablet:overflow-y-auto'

/**
 * Batch mode of [[File processor shell]]: many files in, one `Blob` out per
 * file. Upload area → queue (add / remove, live preview of one file) →
 * Process → per-file results with single and ZIP downloads. A file that
 * fails to process is listed, not fatal. ADR-0026, ADR-0028.
 */
export const BatchFileProcessor = ({
  accept,
  actionIcon,
  actionLabel,
  autoOpen,
  canProcess = true,
  description,
  failureToastLabel,
  getOutputName,
  noun = DEFAULT_NOUN,
  onAfterClose,
  previewKey,
  process,
  rejectToastLabel,
  resultLabel = 'Result',
  settings,
  title,
  triggerLabel,
  uploadLabel,
  validate,
  zipPrefix,
}: FileProcessorBatchProps) => {
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
  const [step, setStep] = useState<FileProcessorBatchStep>('queue')
  const [items, setItems] = useState<Array<FileProcessorItem>>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState<Array<FileProcessorResult>>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  // Live preview of one queued file (the clicked row, else the first) with the current settings.
  const previewItem = items.find((it) => it.id === selectedId) ?? items[0] ?? null
  const preview = useToolComputation<FileProcessorPreviewInput, FileProcessorOutput | null>(
    ({ item }) => (item ? process(item.file, { height: item.height, width: item.width }) : null),
    { debounceMs: PREVIEW_DEBOUNCE_MS, initial: null, isEmpty: ({ item }) => !item },
  )
  const { setInput: setPreviewInput, setInputImmediate: setPreviewInputImmediate } = preview
  const previewTarget = step === 'queue' && canProcess ? previewItem : null
  const lastPreviewIdRef = useRef<string | null>(null)
  // Settings live in the Tool, so `previewKey` is the only signal that they changed.
  // A new file previews at once; a settings change waits out the debounce.
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

  const handleAdd = (files: Array<File>) => {
    const isValid = validate ?? ((f: File) => matchesAccept(f, accept))
    const valid = files.filter(isValid)
    if (valid.length < files.length) showError(rejectToastLabel)
    if (valid.length === 0) return

    const added = valid.map((file) => ({ file, height: 0, id: `file-${nextIdRef.current++}`, width: 0 }))
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
  }

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  // The dialog frame runs this on close (there is no Reset button): back to the upload area.
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

    const out: Array<FileProcessorResult> = []
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
        out.push({ error: describeError(err), id: item.id, source: item, status: 'failed' })
      }
      setProgress({ done: out.length, total: queue.length })
    }

    // Pressing Process is an action, so its total failure is a toast; the queue stays for another try.
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
  const failedCount = results.length - doneResults.length

  const handleDownloadAll = async () => {
    const files: Record<string, Blob> = {}
    for (const r of doneResults) files[r.name] = r.blob
    const session = newSession()
    const zip = await buildZipBlob(files)
    if (!session.isFresh()) return
    downloadBlob(zip, mintZipName(zipPrefix))
  }

  const shownResult = doneResults.find((r) => r.id === selectedResultId) ?? doneResults[0]

  const previewError = step === 'queue' && canProcess && items.length > 0 ? preview.error : null
  const notices =
    step === 'results' && failedCount > 0
      ? [
          `${countLabel(failedCount, noun)} could not be processed and ${failedCount === 1 ? 'is' : 'are'} left out of the download.`,
        ]
      : undefined

  const body = (() => {
    if (step === 'processing') {
      return (
        <div aria-live="polite" className="flex w-full grow flex-col items-center justify-center gap-6">
          <NotoEmoji emoji="robot" size={120} />
          <div className="flex w-full flex-col items-center gap-2 desktop:w-8/10">
            <ProgressBar value={progress.total ? (progress.done / progress.total) * 100 : 0} />
            <span className="text-body-sm text-gray-400">
              {progress.done} of {progress.total}
            </span>
          </div>
        </div>
      )
    }

    if (step === 'results') {
      return (
        <FileProcessorWorkArea
          input={
            <>
              <p aria-live="polite" className="shrink-0 text-body-sm text-gray-300">
                {doneResults.length} of {countLabel(results.length, noun)} ready
              </p>
              <ul aria-label="Results" className={ROW_LIST}>
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
                        <FileThumbnail alt={r.name} blob={r.blob} variant="row" />
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
            </>
          }
          inputFooter={
            <Button block icon={<ArrowIcon />} onClick={() => setStep('queue')}>
              Change settings
            </Button>
          }
          output={
            shownResult && (
              <FileCompare
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
            )
          }
          outputFooter={
            doneResults.length > 1 ? (
              <Button block icon={<DownloadIcon />} onClick={handleDownloadAll} variant="primary">
                Download ZIP
              </Button>
            ) : (
              <Button
                block
                icon={<DownloadIcon />}
                onClick={() => shownResult && downloadBlob(shownResult.blob, shownResult.name)}
                variant="primary"
              >
                Download
              </Button>
            )
          }
          variant="rail"
        />
      )
    }

    if (items.length === 0) {
      return (
        <FileUploadArea
          accept={accept}
          label={uploadLabel}
          multiple
          name={noun.other}
          noun={noun}
          onFiles={handleAdd}
        />
      )
    }

    return (
      <FileProcessorWorkArea
        input={
          <>
            <p className="shrink-0 text-body-sm text-gray-400">{countLabel(items.length, noun)}</p>
            <ul aria-label={`Selected ${noun.other}`} className={ROW_LIST}>
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
                      <FileThumbnail alt={item.file.name} blob={item.file} variant="row" />
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
                button={{ block: true, children: `Add more ${noun.other}` }}
                multiple
                name={`${noun.other}-add`}
                onChange={handleAdd}
              />
            </div>
          </>
        }
        inputFooter={
          // Mounted only in the queue step, so ⌘/Ctrl+Enter cannot start a second run mid-run.
          <ModEnterAction disabled={!canProcess} onTrigger={() => void handleRun()}>
            <Button block disabled={!canProcess} icon={actionIcon} onClick={handleRun} variant="primary">
              {items.length > 1 ? `${actionLabel} ${countLabel(items.length, noun)}` : actionLabel}
            </Button>
          </ModEnterAction>
        }
        output={
          previewItem && (
            <FileCompare
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
                status: canProcess ? null : (
                  <p className="text-center text-body-xs text-gray-500">Choose the options above to see a preview.</p>
                ),
              }}
            />
          )
        }
        variant="rail"
      />
    )
  })()

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      size="screen"
      title={title}
      triggers={[{ label: triggerLabel }]}
    >
      <div className="flex w-full grow flex-col gap-4 tablet:min-h-0">
        {step === 'queue' && items.length > 0 && <div className="flex w-full shrink-0 flex-col gap-2">{settings}</div>}
        <ToolStatus
          error={previewError}
          errorLabel={previewError != null ? `Preview failed: ${describeError(previewError)}` : undefined}
          notices={notices}
        />
        {body}
      </div>
    </ToolDialogFrame>
  )
}
