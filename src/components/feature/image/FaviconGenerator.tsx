import { Button, CopyButton, DownloadIcon, RefreshIcon } from '@/components/common'
import { UploadDialogFrame } from '@/components/common/dialog/UploadDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBatchAssetPipeline } from '@/hooks'
import type { FaviconResult, ToolComponentProps } from '@/types'
import { generateFaviconLinkTags, generateFavicons } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['favicon-generator']
const linkTags = generateFaviconLinkTags()
const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'

const flattenForZip = (results: Array<FaviconResult>): Record<string, Blob> => {
  const files: Record<string, Blob> = {}
  for (const r of results) files[r.size.name] = r.blob
  return files
}

export const FaviconGenerator = ({ onAfterDialogClose }: ToolComponentProps) => {
  const pipeline = useBatchAssetPipeline<Array<FaviconResult>>({
    accept: ACCEPT,
    failureToastLabel: 'Failed to generate favicons',
    mimePrefix: 'image/',
    rejectToastLabel: 'Please select an image file',
    successToastLabel: 'Favicons generated successfully',
  })

  const handleUpload = async (files: Array<File>, openDialog: () => void) => {
    if (!files[0]) return
    openDialog()
    await pipeline.upload(files)
    await pipeline.regenerate(async (img) => generateFavicons(img))
  }

  const handleDownloadAll = async () => {
    if (!pipeline.results) return
    await pipeline.downloadAll('favicons.zip', flattenForZip(pipeline.results))
  }

  const results = pipeline.results ?? []

  return (
    <UploadDialogFrame
      accept={ACCEPT}
      buttonLabel="Select image to generate favicons"
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={pipeline.reset}
      onUpload={handleUpload}
      title="Favicon Generator"
      uploadInputName="favicon-source"
    >
      <div className="flex grow flex-col gap-6 overflow-y-auto">
        {/* Source + Generated grid */}
        <div className="flex flex-col gap-6 tablet:flex-row">
          {/* Source image */}
          {pipeline.sourcePreview && (
            <div className="flex shrink-0 flex-col items-center gap-2">
              <p className="text-body-sm font-medium text-gray-300">Source Image</p>
              <img
                alt="source"
                className="w-full max-w-40 rounded border border-gray-800"
                src={pipeline.sourcePreview}
              />
              <Button icon={<RefreshIcon />} onClick={pipeline.openFilePicker} size="small">
                Upload New
              </Button>
            </div>
          )}

          {/* Generated favicons grid */}
          {results.length > 0 && (
            <div className="flex grow flex-col gap-3">
              <p className="text-body-sm font-medium text-gray-300">Generated Favicons</p>
              <div className="grid grid-cols-3 gap-4 tablet:grid-cols-6">
                {results.map((result) => (
                  <button
                    className="flex cursor-pointer flex-col items-center gap-1 rounded border border-gray-800 p-2 transition-colors hover:border-gray-600"
                    key={result.size.name}
                    onClick={() => pipeline.downloadOne(result.blob, result.size.name)}
                    title={`Download ${result.size.name}`}
                    type="button"
                  >
                    <div className="bg-grid-texture flex items-center justify-center rounded p-2">
                      <img
                        alt={`${result.size.width}x${result.size.height}`}
                        height={Math.min(result.size.height, 64)}
                        src={result.dataUrl}
                        width={Math.min(result.size.width, 64)}
                      />
                    </div>
                    <span className="text-body-xs text-gray-400">
                      {result.size.width}x{result.size.height}
                    </span>
                  </button>
                ))}
              </div>
              <Button block icon={<DownloadIcon />} onClick={handleDownloadAll} variant="primary">
                Download All (ZIP)
              </Button>
            </div>
          )}

          {pipeline.pending && (
            <div className="flex grow items-center justify-center">
              <p className="text-body-sm text-gray-400">Generating favicons...</p>
            </div>
          )}
        </div>

        {/* Link tags */}
        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="text-body-sm font-medium text-gray-300">HTML Link Tags</p>
              <CopyButton label="link tags" value={linkTags} />
            </div>
            <pre className="overflow-x-auto rounded border border-gray-800 bg-black p-3 text-body-xs text-gray-300">
              <code>{linkTags}</code>
            </pre>
          </div>
        )}
      </div>
    </UploadDialogFrame>
  )
}
