import { useCallback, useRef, useState } from 'react'

import { useToast } from '@/hooks/state/useToast'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { useToolComputation } from '@/hooks/useToolComputation'
import type { FileProcessorPipelineInput, FileProcessorPreviewContext, FileProcessorSingleProps } from '@/types'
import { downloadBlob } from '@/utils/download'
import { matchesAccept } from '@/utils/file'

import { ToolStatus } from '../banner'
import { Button } from '../button'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { DownloadIcon } from '../icon'
import { UploadInput } from '../input/UploadInput'
import { DEFAULT_NOUN, FileProcessorWorkArea, FileUploadArea } from './FileProcessorParts'

const DEFAULT_ERROR = 'Could not process this file'

/**
 * Single-file mode of [[File processor shell]]: one file in, one `Blob` out,
 * recomputed live whenever the shell-owned controls bag changes (ADR-0014).
 */
export function SingleFileProcessor<TControls extends object>({
  accept,
  autoOpen,
  controlsDebounceMs,
  description,
  errorFallback = DEFAULT_ERROR,
  errorLabel,
  getDownloadFilename,
  initialControls,
  noun = DEFAULT_NOUN,
  onAfterClose,
  process,
  rejectToastLabel,
  renderControls,
  renderResult,
  renderSource,
  title,
  triggerLabel,
  uploadLabel,
  validate,
}: FileProcessorSingleProps<TControls>) {
  const showError = useToast((s) => s.showError)
  const [source, setSource] = useState<File | null>(null)
  const [controls, setControlsState] = useState<TControls>(initialControls)
  // Every write to `controls` / `source` goes through these refs first, so
  // same-tick handlers (and `recompute`) read the live values without a
  // render-time mirror.
  const controlsRef = useRef(controls)
  const sourceRef = useRef(source)
  const initialRef = useRef(initialControls)

  // No errorLabel / onError here: input errors never toast. The status slot shows them.
  const { error, isPending, result, setInput, setInputImmediate } = useToolComputation<
    FileProcessorPipelineInput<TControls>,
    Blob | null
  >(
    async ({ file, controls: c }, context) => {
      if (!file) return null
      return process(file, c, context)
    },
    // `process` may return null when the Tool has too little state for a
    // result (e.g. ImageCropper before a crop region exists).
    {
      debounceMs: controlsDebounceMs,
      initial: null,
      isEmpty: ({ file }) => !file,
    },
  )

  // A stale result beside an error reads as valid output — clear it.
  const shownResult = error != null ? null : result
  const sourceUrl = useBlobUrl(source)
  const resultUrl = useBlobUrl(shownResult)

  // The recompute escape hatch: a Tool whose result depends on state outside
  // the controls bag (imgRef, a cache) re-fires compute without changing the
  // bag — e.g. after <img onLoad> populates imgRef. See ADR-0014.
  const recompute = useCallback(() => {
    setInputImmediate({ controls: controlsRef.current, file: sourceRef.current })
  }, [setInputImmediate])

  // setControls IS the recompute trigger — every partial merges into the live
  // bag (ref-based, so same-tick partials compose) and routes through the
  // pipeline. See [[Tool field bag]] in CONTEXT.md for the merge invariant.
  const setControls = useCallback(
    (partial: Partial<TControls>) => {
      const next = { ...controlsRef.current, ...partial }
      controlsRef.current = next
      setControlsState(next)
      const input = { controls: next, file: sourceRef.current }
      if (controlsDebounceMs === undefined) setInputImmediate(input)
      else setInput(input)
    },
    [controlsDebounceMs, setInput, setInputImmediate],
  )

  const handleDownload = () => {
    if (!shownResult || !source) return
    downloadBlob(shownResult, getDownloadFilename({ controls, result: shownResult, sourceName: source.name }))
  }

  const startFrom = (file: File | null) => {
    // A new file (or none) always starts from the initial bag, so tool-local
    // state is re-derived from the new source (e.g. ImageResizer's <img onLoad>).
    const init = initialRef.current
    controlsRef.current = init
    setControlsState(init)
    sourceRef.current = file
    setSource(file)
    setInputImmediate({ controls: init, file })
  }

  const handleFiles = (files: Array<File>) => {
    const file = files[0]
    if (!file) return
    if (!(validate ?? ((f: File) => matchesAccept(f, accept)))(file)) {
      showError(rejectToastLabel)
      return
    }
    startFrom(file)
  }

  // The dialog frame runs this on close (there is no Reset button): back to
  // the upload area with the initial controls. Tools clear their own
  // non-controls state in onAfterClose, which runs after this.
  const handleReset = () => startFrom(null)

  const ctx: FileProcessorPreviewContext<TControls> | null =
    source && sourceUrl
      ? {
          controls,
          error,
          pending: isPending,
          recompute,
          result: shownResult,
          resultUrl,
          setControls,
          source,
          sourceUrl,
        }
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
        {/* `recompute` / `setControls` read refs but are only ever invoked by
            adopters from handlers / <img onLoad>, never during render — the
            render-prop contract of ADR-0014. */}
        {source &&
          // oxlint-disable-next-line react/refs -- ADR-0014 render-prop callbacks run from handlers only
          renderControls({ controls, pending: isPending, recompute, setControls })}
        <ToolStatus error={error} errorFallback={errorFallback} errorLabel={errorLabel} />
        {source ? (
          <FileProcessorWorkArea
            // oxlint-disable-next-line react/refs -- ADR-0014 render-prop callbacks run from handlers only
            input={ctx ? renderSource(ctx) : null}
            inputFooter={
              // Swap without closing (close navigates home on the tool route).
              // A new file resets the controls bag, so Tools must re-derive
              // tool-local state from the new source — never assume it survives.
              <UploadInput
                accept={accept}
                button={{ block: true, children: `Choose another ${noun.one}` }}
                multiple={false}
                name={`${noun.one}-replace`}
                onChange={handleFiles}
              />
            }
            // oxlint-disable-next-line react/refs -- ADR-0014 render-prop callbacks run from handlers only
            output={ctx ? renderResult(ctx) : null}
            outputFooter={
              shownResult && !isPending ? (
                <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
                  Download
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
            onFiles={handleFiles}
          />
        )}
      </div>
    </ToolDialogFrame>
  )
}
