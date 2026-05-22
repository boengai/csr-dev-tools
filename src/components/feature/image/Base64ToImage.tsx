import { Button, DownloadIcon, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDownload, useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type Base64ImageInfo, base64ToImageInfo, formatFileSize } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['base64-to-image']

export const Base64ToImage = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { downloadDataUrl } = useDownload()

  const {
    input,
    result: info,
    setInput,
    reset,
  } = useToolInput<string, Base64ImageInfo | null>({
    compute: async (val) => base64ToImageInfo(val.trim()),
    debounceMs: 500,
    errorLabel: 'Invalid Base64 image data',
    initial: '',
    initialResult: null,
    isEmpty: (val) => !val.trim(),
  })

  const handleDownload = () => {
    if (!info) return
    const filename = `image.${info.format}`
    downloadDataUrl(info.dataUri, filename)
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="Base64 to Image"
      triggers={[{ label: 'Convert Base64 to Image' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="Base64 or Data URI"
              name="base64-input"
              onChange={setInput}
              placeholder="Paste base64 string or data:image/... URI"
              rows={12}
              type="textarea"
              value={input}
            />
          </Pane>

          <Pane align="center" gap="lg" live>
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
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
