import { useState } from 'react'

import { Button, DownloadIcon } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { UploadInput } from '@/components/common/input'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { useToolComputation } from '@/hooks/useToolComputation'
import type { ImageToolShellProps } from '@/types'
import { downloadBlob } from '@/utils/download'

type PipelineInput<TControls> = {
  file: File | null
  controls: TControls
}

export function ImageToolShell<TControls>({
  accept,
  controls,
  description,
  getDownloadFilename,
  onAfterDialogClose,
  onRejectInvalidFile,
  process,
  renderControls,
  renderPreview,
  title,
  uploadLabel,
}: ImageToolShellProps<TControls>) {
  const [source, setSource] = useState<File | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { error, isPending, result, setInputImmediate } = useToolComputation<PipelineInput<TControls>, Blob | null>(
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

  const recompute = () => {
    setInputImmediate({ file: source, controls })
  }

  const handleDownload = () => {
    if (!result || !source) return
    const filename = getDownloadFilename({ result, sourceName: source.name })
    downloadBlob(result, filename)
  }

  const handleUpload = (files: Array<File>) => {
    const file = files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onRejectInvalidFile?.(file)
      return
    }
    setSource(file)
    setDialogOpen(true)
    setInputImmediate({ file, controls })
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {description && <p className="shrink-0 text-body-xs text-gray-400">{description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          <UploadInput
            accept={accept}
            button={{ block: true, children: uploadLabel }}
            multiple={false}
            name="image-tool-shell-source"
            onChange={handleUpload}
          />
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        size="screen"
        title={title}
      >
        <div className="flex grow flex-col gap-4">
          {renderControls({ pending: isPending, recompute })}
          {source && sourceUrl
            ? renderPreview({
                error,
                pending: isPending,
                recompute,
                result,
                resultUrl,
                source,
                sourceUrl,
              })
            : null}
          {result && !isPending && (
            <div className="w-full desktop:w-8/10">
              <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
                Download
              </Button>
            </div>
          )}
        </div>
      </ToolDialogShell>
    </>
  )
}
