import { useCallback, useRef, useState } from 'react'

import { useBlobUrl } from '@/hooks/useBlobUrl'
import { useToolComputation } from '@/hooks/useToolComputation'
import type { ImageToolPipelineInput, ImageToolShellProps } from '@/types'
import { downloadBlob } from '@/utils/download'

import { Button } from '../button'
import { UploadDialogFrame } from '../dialog/UploadDialogFrame'
import { DownloadIcon } from '../icon'
import { UploadInput } from '../input/UploadInput'

export function ImageToolShell<TControls extends object>({
  accept,
  description,
  getDownloadFilename,
  initialControls,
  onAfterClose,
  onRejectInvalidFile,
  process,
  renderControls,
  renderPreview,
  title,
  uploadLabel,
}: ImageToolShellProps<TControls>) {
  const [source, setSource] = useState<File | null>(null)
  const [controls, setControlsState] = useState<TControls>(initialControls)
  const controlsRef = useRef(controls)
  controlsRef.current = controls
  const sourceRef = useRef(source)
  sourceRef.current = source
  const initialRef = useRef(initialControls)

  const { error, isPending, result, setInputImmediate } = useToolComputation<
    ImageToolPipelineInput<TControls>,
    Blob | null
  >(
    async ({ file, controls: c }) => {
      if (!file) return null
      return process(file, c)
    },
    // Tool's process may return null when it has insufficient state to produce
    // a result (e.g. ImageCropper before the user finishes selecting a region).
    {
      initial: null,
      isEmpty: ({ file }) => !file,
    },
  )

  const sourceUrl = useBlobUrl(source)
  const resultUrl = useBlobUrl(result)

  // The recompute escape hatch for non-controls-driven cases: a Tool whose
  // result depends on React state outside the controls bag (imgRef.current,
  // cacheRef) and needs to fire compute without changing the bag — e.g. after
  // <img onLoad> populates imgRef in ImageCropper. See ADR-0014.
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
      setInputImmediate({ controls: next, file: sourceRef.current })
    },
    [setInputImmediate],
  )

  const handleDownload = () => {
    if (!result || !source) return
    const filename = getDownloadFilename({ controls, result, sourceName: source.name })
    downloadBlob(result, filename)
  }

  // `openDialog` comes from <UploadDialogFrame> on the tile upload; the
  // in-dialog "Choose another image" swap calls this without it (already open).
  const handleUpload = (files: Array<File>, openDialog?: () => void) => {
    const file = files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onRejectInvalidFile?.(file)
      return
    }
    // Reset the bag to initial so a new image is re-derived from scratch (e.g.
    // ImageResizer's <img onLoad> guard only re-reads dimensions when they're
    // null). Matches the on-close reset — a new file always starts fresh.
    const init = initialRef.current
    controlsRef.current = init
    setControlsState(init)
    setSource(file)
    sourceRef.current = file
    openDialog?.()
    setInputImmediate({ controls: init, file })
  }

  // Auto-reset controls to initialControls when the dialog closes — the
  // shell owns the bag's lifecycle. Consumers handle per-Tool non-controls
  // cleanup (refs, UI-only state) in onAfterClose (runs after this).
  const handleReset = () => {
    const init = initialRef.current
    controlsRef.current = init
    setControlsState(init)
  }

  return (
    <UploadDialogFrame
      accept={accept}
      buttonLabel={uploadLabel}
      description={description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      onUpload={handleUpload}
      size="screen"
      title={title}
      uploadInputName="image-tool-shell-source"
    >
      <div className="flex grow flex-col gap-4">
        {renderControls({ controls, pending: isPending, recompute, setControls })}
        {source && sourceUrl
          ? renderPreview({
              controls,
              error,
              pending: isPending,
              recompute,
              result,
              resultUrl,
              setControls,
              source,
              sourceUrl,
            })
          : null}
        {/* Once an image is loaded, "Choose another image" lets the user swap
              without closing (close navigates home). Swap-safe contract: a new
              file resets the controls bag, so consumers must re-derive any
              tool-local state from the new source (via <img onLoad>) or key it
              by file identity — never assume state survives a swap. */}
        {source && (
          <div className={result && !isPending ? 'grid grid-cols-2 gap-2' : 'flex'}>
            <UploadInput
              accept={accept}
              button={{ block: true, children: 'Choose another image' }}
              multiple={false}
              name="image-tool-shell-replace"
              onChange={handleUpload}
            />
            {result && !isPending && (
              <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
                Download
              </Button>
            )}
          </div>
        )}
      </div>
    </UploadDialogFrame>
  )
}
