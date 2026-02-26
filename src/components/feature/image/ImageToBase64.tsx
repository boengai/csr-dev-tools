import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { ImageBase64Result } from '@/utils'

import { CopyButton, Dialog, FieldForm, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import { formatBase64Size, formatFileSize, imageFileToBase64 } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-to-base64']

export const ImageToBase64 = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [result, setResult] = useState<ImageBase64Result | null>(null)
  const { toast } = useToast()

  const handleInputChange = async (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        action: 'add',
        item: { label: 'Please select an image file', type: 'error' },
      })
      return
    }

    try {
      const data = await imageFileToBase64(file)
      setResult(data)
      setDialogOpen(true)
    } catch {
      toast({
        action: 'add',
        item: { label: 'Failed to convert image', type: 'error' },
      })
    }
  }

  const handleReset = () => {
    setResult(null)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <UploadInput
            accept="image/*"
            button={{ block: true, children: 'Select image' }}
            multiple={false}
            name="image-to-base64"
            onChange={handleInputChange}
          />
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="Image to Base64"
      >
        {result && (
          <div className="flex w-full grow flex-col gap-4">
            <div className="flex items-start gap-4">
              <img
                alt={result.fileName}
                className="max-h-24 max-w-24 shrink-0 rounded-lg border border-gray-800 object-contain"
                src={result.dataUri}
              />
              <div className="flex flex-col gap-1">
                <p className="text-body-sm text-gray-300">
                  {result.fileName} — {result.width}x{result.height} — {formatFileSize(result.originalSize)}
                </p>
                <p className="text-body-xs text-gray-500">Base64 length: {formatBase64Size(result.base64Length)}</p>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-900" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex min-h-0 flex-col gap-2">
                <FieldForm
                  disabled
                  label={
                    <span className="flex items-center gap-1">
                      <span>Data URI</span>
                      <CopyButton label="data URI" value={result.dataUri} />
                    </span>
                  }
                  name="data-uri"
                  placeholder=""
                  rows={4}
                  type="textarea"
                  value={result.dataUri}
                />
              </div>

              <div className="flex min-h-0 flex-col gap-2">
                <FieldForm
                  disabled
                  label={
                    <span className="flex items-center gap-1">
                      <span>Base64 Only</span>
                      <CopyButton label="base64" value={result.base64Only} />
                    </span>
                  }
                  name="base64-only"
                  placeholder=""
                  rows={4}
                  type="textarea"
                  value={result.base64Only}
                />
              </div>

              <div className="flex min-h-0 flex-col gap-2">
                <FieldForm
                  disabled
                  label={
                    <span className="flex items-center gap-1">
                      <span>HTML Tag</span>
                      <CopyButton label="HTML tag" value={result.htmlTag} />
                    </span>
                  }
                  name="html-tag"
                  placeholder=""
                  rows={3}
                  type="textarea"
                  value={result.htmlTag}
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
