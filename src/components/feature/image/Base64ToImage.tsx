import { useState } from 'react'

import { Button, DownloadIcon, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type Base64ImageInfo, base64ToImageInfo, downloadDataUrl, formatFileSize } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['base64-to-image']

export const Base64ToImage = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [input, setInputValue] = useState('')
  const { showError, showSuccess } = useToast()

  const {
    result: info,
    setInput,
    setInputImmediate,
  } = useToolComputation<string, Base64ImageInfo | null>(async (val) => base64ToImageInfo(val.trim()), {
    debounceMs: 500,
    initial: null,
    isEmpty: (val) => !val.trim(),
    onError: () => showError('Invalid Base64 image data'),
  })

  const handleInputChange = (val: string) => {
    setInputValue(val)
    setInput(val)
  }

  const handleDownload = () => {
    if (!info) return
    const filename = `image.${info.format}`
    downloadDataUrl(info.dataUri, filename)
    showSuccess(`Downloaded ${filename}`)
  }

  const handleReset = () => {
    setInputValue('')
    setInputImmediate('')
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="Base64 to Image"
      triggers={[{ label: 'Convert Base64 to Image' }]}
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
    </ToolDialogFrame>
  )
}
