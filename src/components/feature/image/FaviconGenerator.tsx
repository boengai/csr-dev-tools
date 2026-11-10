import { FileProcessorShell } from '@/components/common/file-processor'
import { IMAGE_FILE_NOUN, TOOL_REGISTRY_MAP } from '@/constants'
import type { FileProcessorAssetsResult, FileProcessorDerivedInput, ToolComponentProps } from '@/types'
import { generateFaviconLinkTags, generateFavicons } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['favicon-generator']
const linkTags = generateFaviconLinkTags()
const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'

const process = async ({ image }: FileProcessorDerivedInput<object>): Promise<FileProcessorAssetsResult> => {
  const favicons = await generateFavicons(image)
  return {
    assetGroups: [
      {
        assets: favicons.map(({ blob, size }) => ({ blob, caption: `${size.width}x${size.height}`, name: size.name })),
        label: 'Favicons',
      },
    ],
    // The link tags are the same for every source; they are not part of the ZIP.
    textOutputs: [{ label: 'HTML link tags', value: linkTags }],
  }
}

export const FaviconGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <FileProcessorShell
    accept={ACCEPT}
    autoOpen={autoOpen}
    description={toolEntry?.description}
    errorLabel="Could not generate favicons from this image"
    noun={IMAGE_FILE_NOUN}
    onAfterClose={onAfterClose}
    output="assets"
    pendingLabel="Generating favicons…"
    placeholder="Add an image to generate its favicons"
    process={process}
    rejectToastLabel="Please select an image file"
    renderSource={({ image, source, sourceUrl }) => (
      <div className="flex grow flex-col items-center justify-center gap-2 p-4">
        <img alt="source" className="max-h-60 max-w-full rounded border border-gray-800" src={sourceUrl} />
        <p className="text-center text-body-xs text-gray-500">
          {source.name} — {image.naturalWidth}x{image.naturalHeight}
        </p>
      </div>
    )}
    title="Favicon Generator"
    triggerLabel="Generate Favicons"
    uploadLabel="Select image to generate favicons"
    // The picker offers ACCEPT; a drop of any other image type is still read (ADR-0016).
    validate={(file) => file.type.startsWith('image/')}
    zipPrefix="favicons"
  />
)
