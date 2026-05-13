import { useRef, useState } from 'react'

import { Button, DownloadIcon, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type Base64ImageInfo, base64ToImageInfo, formatFileSize } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['base64-to-image']

export const Base64ToImage = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [input, setInputValue] = useState('')
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const { toast } = useToast()

  const { result: info, setInput, setInputImmediate } = useToolComputation<string, Base64ImageInfo | null>(
    async (val) => base64ToImageInfo(val.trim()),
    {
      debounceMs: 500,
      initial: null,
      isEmpty: (val) => !val.trim(),
      onError: () => {
        toast({
          action: 'add',
          item: { label: 'Invalid Base64 image data', type: 'error' },
        })
      },
    },
  )

  const handleInputChange = (val: string) => {
    setInputValue(val)
    setInput(val)
  }

  const handleDownload = () => {
    if (!info) return
    const anchor = downloadAnchorRef.current
    if (!anchor) return
    anchor.href = info.dataUri
    anchor.download = `image.${info.format}`
    anchor.click()
    toast({
      action: 'add',
      item: { label: `Downloaded image.${info.format}`, type: 'success' },
    })
  }

  const handleReset = () => {
    setInputValue('')
    setInputImmediate('')
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Convert Base64 to Image
          </Button>
        </div>
      </div>
      <ToolDialogShell
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAfterDialogClose={onAfterDialogClose}
        onReset={handleReset}
        size="screen"
        title="Base64 to Image"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Base64 or Data URI"
                name="base64-input"
                onChange={handleInputChange}
                placeholder="Paste base64 string or data:image/... URI"
                rows={12}
                type="textarea"
                value={input}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-4">
              {info ? (
                <>
                  <img
                    alt="Decoded Base64 content"
                    className="max-h-80 max-w-full rounded-lg object-contain"
                    src={info.dataUri}
                  />
                  <div className="flex flex-col gap-1 text-center">
                    <p className="text-body-sm text-gray-300">
                      {info.width}x{info.height} — {info.format.toUpperCase()}
                    </p>
                    <p className="text-body-xs text-gray-500">Estimated size: {formatFileSize(info.estimatedSize)}</p>
                  </div>
                  <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
                    Download
                  </Button>
                </>
              ) : (
                <p className="text-body-sm text-gray-500">Paste Base64 data to preview the image</p>
              )}
            </div>
          </div>
        </div>
      </ToolDialogShell>
      <a aria-hidden="true" className="hidden" download href="about:blank" ref={downloadAnchorRef} tabIndex={-1} />
    </>
  )
}
