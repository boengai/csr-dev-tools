import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps, TransformerImage } from '@/types'
import { base64ToImageInfo, formatFileSize } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['base64-to-image']

const INITIAL = { source: '' }

// The caption ("16×16 PNG image, about 1.2 KB") is the alt text and the notice.
const computeImage = async ({ source }: { source: string }): Promise<TransformerImage> => {
  const info = await base64ToImageInfo(source.trim())
  return {
    alt: `${info.width}×${info.height} ${info.format.toUpperCase()} image, about ${formatFileSize(info.estimatedSize)}`,
    filename: `image.${info.format}`,
    src: info.dataUri,
  }
}

export const Base64ToImage = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'image'>
    autoOpen={autoOpen}
    compute={computeImage}
    description={toolEntry?.description}
    errorLabel="Invalid Base64 image data"
    initial={INITIAL}
    notices={(image) => (image ? [image.alt] : [])}
    onAfterClose={onAfterClose}
    outputKind="image"
    // Never saved before the shell; kept that way.
    persistInput={false}
    resultLabel="Image"
    resultPlaceholder="Paste Base64 data or a data:image URI on the left to see the image"
    sourceKind="textarea"
    sourceLabel="Base64 or Data URI"
    sourcePlaceholder="Paste base64 string or data:image/... URI"
    title="Base64 to Image"
    triggerLabel="Convert Base64 to Image"
  />
)
