import { useCallback, useRef, useState } from 'react'

import { useToast } from '@/hooks/state/useToast'
import { useBatchAssetPipeline } from '@/hooks/useBatchAssetPipeline'
import type {
  FileProcessorAssetsResult,
  FileProcessorDerivedProps,
  FileProcessorDerivedResult,
  FileProcessorSourceContext,
} from '@/types'
import { matchesAccept } from '@/utils/file'

import { ToolStatus } from '../banner'
import { Button, ModEnterAction } from '../button'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { DownloadIcon } from '../icon'
import { UploadInput } from '../input/UploadInput'
import { FileAssetGroups, FileTextOutputs } from './FileProcessorOutputs'
import { DEFAULT_NOUN, FileProcessorWorkArea, FileUploadArea, mintZipName } from './FileProcessorParts'

const DEFAULT_ERROR = 'Could not process this file'
const NO_CONTROLS = {}

const isAssetsResult = (result: FileProcessorDerivedResult): result is FileProcessorAssetsResult =>
  'assetGroups' in result

const zipEntries = (result: FileProcessorAssetsResult): Record<string, Blob | string> => {
  const files: Record<string, Blob | string> = {}
  for (const group of result.assetGroups)
    for (const asset of group.assets) files[asset.zipPath ?? asset.name] = asset.blob
  for (const text of result.textOutputs ?? []) if (text.zipPath) files[text.zipPath] = text.value
  return files
}

/**
 * Derived-output modes of [[File processor shell]]: one image in, a set of
 * outputs out — `assets` (a card per file, Download ZIP at the bottom, plus
 * optional copyable text) or `text` (copyable text blocks only). The source
 * is decoded once when added ([[Batch asset pipeline]]); `process` runs on add
 * and on every control change, or only on the Process button when
 * `actionLabel` is set (slow work).
 */
export function DerivedFileProcessor<TControls extends object>(props: FileProcessorDerivedProps<TControls>) {
  const {
    accept,
    actionLabel,
    autoOpen,
    description,
    errorFallback = DEFAULT_ERROR,
    errorLabel,
    noun = DEFAULT_NOUN,
    onAfterClose,
    pendingLabel,
    placeholder,
    process,
    rejectToastLabel,
    renderControls,
    renderSource,
    title,
    triggerLabel,
    uploadLabel,
    validate,
  } = props
  const showError = useToast((s) => s.showError)
  // A Tool with no controls gets an empty bag it never reads.
  const [initialControls] = useState(() => (props.initialControls ?? NO_CONTROLS) as TControls)
  const [controls, setControlsState] = useState<TControls>(initialControls)
  // Live values for same-tick handlers (upload → run, setControls → run).
  const controlsRef = useRef(controls)
  const fileRef = useRef<File | null>(null)
  // No failure toast: a `process` rejection goes to the status slot. A file
  // that cannot be decoded still toasts `rejectToastLabel` (reading it failed).
  const pipeline = useBatchAssetPipeline<FileProcessorDerivedResult>({ rejectToastLabel })
  const { regenerate } = pipeline

  const run = useCallback(
    (next: TControls) => {
      const file = fileRef.current
      if (!file) return Promise.resolve()
      return regenerate((image, report) => process({ controls: next, file, image, report }))
    },
    [process, regenerate],
  )

  const recompute = useCallback(() => void run(controlsRef.current), [run])

  const setControls = useCallback(
    (partial: Partial<TControls>) => {
      const next = { ...controlsRef.current, ...partial }
      controlsRef.current = next
      setControlsState(next)
      // With a Process button, a control change waits for the next press.
      if (!actionLabel) void run(next)
    },
    [actionLabel, run],
  )

  const handleFiles = async (files: Array<File>) => {
    const file = files[0]
    if (!file) return
    if (!(validate ?? ((f: File) => matchesAccept(f, accept)))(file)) {
      showError(rejectToastLabel)
      return
    }
    // A new source keeps the controls; it drops the outputs of the old one.
    if (!(await pipeline.upload([file]))) return
    fileRef.current = file
    if (!actionLabel) await run(controlsRef.current)
  }

  // The dialog frame runs this on close (there is no Reset button): back to
  // the upload area with the initial controls.
  const handleReset = () => {
    pipeline.reset()
    fileRef.current = null
    controlsRef.current = initialControls
    setControlsState(initialControls)
  }

  const { error, pending, progress, sourceFile, sourceImage, sourcePreview } = pipeline
  // A stale result beside an error reads as valid output — hide it.
  const result = error != null ? null : pipeline.results
  const pendingText = progress ? `${pendingLabel} ${progress.current}/${progress.total}` : pendingLabel

  const handleDownloadZip = async () => {
    if (!result || !isAssetsResult(result) || props.output !== 'assets') return
    await pipeline.downloadAll(mintZipName(props.zipPrefix), zipEntries(result))
  }

  const hasSource = Boolean(sourceFile && sourceImage && sourcePreview)
  const ctx: FileProcessorSourceContext<TControls> | null =
    sourceFile && sourceImage && sourcePreview
      ? { controls, image: sourceImage, pending, recompute, setControls, source: sourceFile, sourceUrl: sourcePreview }
      : null

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
        {/* `recompute` / `setControls` read refs but run from handlers only (ADR-0014). */}
        {hasSource &&
          // oxlint-disable-next-line react/refs -- ADR-0014 render-prop callbacks run from handlers only
          renderControls?.({ controls, pending, recompute, setControls })}
        <ToolStatus error={error} errorFallback={errorFallback} errorLabel={errorLabel} />
        {hasSource ? (
          <FileProcessorWorkArea
            // oxlint-disable-next-line react/refs -- ADR-0014 render-prop callbacks run from handlers only
            input={ctx ? renderSource(ctx) : null}
            inputFooter={
              <div className="flex flex-col gap-2">
                {actionLabel && (
                  <ModEnterAction disabled={pending} onTrigger={recompute}>
                    <Button block disabled={pending} onClick={recompute} variant="primary">
                      {pending ? pendingText : actionLabel}
                    </Button>
                  </ModEnterAction>
                )}
                {/* Swap without closing (close navigates home on the tool route). */}
                <UploadInput
                  accept={accept}
                  button={{ block: true, children: `Choose another ${noun.one}` }}
                  multiple={false}
                  name={`${noun.one}-replace`}
                  onChange={(files) => void handleFiles(files)}
                />
              </div>
            }
            output={
              <div
                aria-busy={pending}
                aria-live="polite"
                className="flex grow flex-col gap-4 overflow-y-auto tablet:min-h-0"
                data-has-value={result ? '' : undefined}
              >
                {result ? (
                  <>
                    {isAssetsResult(result) && <FileAssetGroups groups={result.assetGroups} />}
                    {result.textOutputs && <FileTextOutputs outputs={result.textOutputs} />}
                  </>
                ) : (
                  <p
                    className="flex grow items-center justify-center p-4 text-center text-body-sm text-gray-500"
                    data-slot="output-placeholder"
                  >
                    {pending ? pendingText : placeholder}
                  </p>
                )}
              </div>
            }
            outputFooter={
              props.output === 'assets' && result && !pending ? (
                <Button block icon={<DownloadIcon />} onClick={() => void handleDownloadZip()} variant="primary">
                  Download ZIP
                </Button>
              ) : null
            }
            variant="split"
          />
        ) : (
          <FileUploadArea
            accept={accept}
            label={uploadLabel}
            multiple={false}
            name={noun.one}
            noun={noun}
            onFiles={(files) => void handleFiles(files)}
          />
        )}
      </div>
    </ToolDialogFrame>
  )
}
