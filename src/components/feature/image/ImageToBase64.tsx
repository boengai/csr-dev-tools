import { FileProcessorShell } from '@/components/common/file-processor'
import { IMAGE_FILE_NOUN, TOOL_REGISTRY_MAP } from '@/constants'
import type { FileProcessorDerivedInput, FileProcessorTextResult, ToolComponentProps } from '@/types'
import { formatBase64Size, formatFileSize, imageFileToBase64 } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-to-base64']

const process = async ({ file }: FileProcessorDerivedInput<object>): Promise<FileProcessorTextResult> => {
  const result = await imageFileToBase64(file)
  return {
    textOutputs: [
      { label: 'Data URI', value: result.dataUri },
      { details: formatBase64Size(result.base64Length), label: 'Base64', value: result.base64Only },
      { label: 'HTML tag', value: result.htmlTag },
    ],
  }
}

export const ImageToBase64 = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <FileProcessorShell
    accept="image/*"
    autoOpen={autoOpen}
    description={toolEntry?.description}
    errorLabel="Failed to convert image"
    noun={IMAGE_FILE_NOUN}
    onAfterClose={onAfterClose}
    output="text"
    pendingLabel="Converting…"
    placeholder="Add an image to encode it as Base64"
    process={process}
    rejectToastLabel="Please select an image file"
    renderSource={({ image, source, sourceUrl }) => (
      <div className="flex grow flex-col items-center justify-center gap-2 p-4">
        <img
          alt={source.name}
          className="max-h-60 max-w-full rounded-lg border border-gray-800 object-contain"
          src={sourceUrl}
        />
        <p className="text-center text-body-xs text-gray-500">
          {source.name} — {image.naturalWidth}x{image.naturalHeight} — {formatFileSize(source.size)}
        </p>
      </div>
    )}
    title="Image to Base64"
    triggerLabel="Encode Image"
    uploadLabel="Select image to encode"
  />
)
