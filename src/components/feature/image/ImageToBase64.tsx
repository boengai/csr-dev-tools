import { useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { UploadDialogFrame } from '@/components/common/dialog/UploadDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { formatBase64Size, formatFileSize, type ImageBase64Result, imageFileToBase64 } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-to-base64']

export const ImageToBase64 = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [result, setResult] = useState<ImageBase64Result | null>(null)
  const { showError } = useToast()

  const handleUpload = async (files: Array<File>, openDialog: () => void) => {
    const file = files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file')
      return
    }

    try {
      const data = await imageFileToBase64(file)
      setResult(data)
      openDialog()
    } catch {
      showError('Failed to convert image')
    }
  }

  const handleReset = () => {
    setResult(null)
  }

  return (
    <UploadDialogFrame
      accept="image/*"
      buttonLabel="Select image"
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      onUpload={handleUpload}
      title="Image to Base64"
      uploadInputName="image-to-base64"
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

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
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
    </UploadDialogFrame>
  )
}
