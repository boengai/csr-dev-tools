import { type ChangeEvent, useCallback, useRef, useState } from 'react'

import { Button, CopyButton, DownloadIcon, RefreshIcon } from '@/components/common'
import { UploadDialogFrame } from '@/components/common/dialog/UploadDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { downloadBlob } from '@/utils/download'
import { downloadFaviconsAsZip, type FaviconResult, generateFaviconLinkTags, generateFavicons, loadImageFromFile } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['favicon-generator']
const linkTags = generateFaviconLinkTags()

export const FaviconGenerator = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [results, setResults] = useState<Array<FaviconResult>>([])
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const sourcePreview = useBlobUrl(sourceFile)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = useCallback(
    async (files: Array<File>, openDialog: () => void) => {
      const file = files[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast({ action: 'add', item: { label: 'Please select an image file', type: 'error' } })
        return
      }

      try {
        setProcessing(true)
        openDialog()
        setSourceFile(file)

        const img = await loadImageFromFile(file)
        const faviconResults = await generateFavicons(img)
        setResults(faviconResults)
        toast({ action: 'add', item: { label: 'Favicons generated successfully', type: 'success' } })
      } catch {
        toast({ action: 'add', item: { label: 'Failed to generate favicons', type: 'error' } })
      } finally {
        setProcessing(false)
      }
    },
    [toast],
  )

  const handleDownloadAll = async () => {
    try {
      await downloadFaviconsAsZip(results)
      toast({ action: 'add', item: { label: 'Downloaded favicons.zip', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Failed to download ZIP', type: 'error' } })
    }
  }

  const handleDownloadSingle = (result: FaviconResult) => {
    downloadBlob(result.blob, result.size.name)
  }

  const resetState = () => {
    setResults([])
    setSourceFile(null)
    setProcessing(false)
  }

  const handleNewUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      resetState()
      // Re-upload from inside the open dialog: openDialog noop is fine.
      void handleUpload(Array.from(files), () => undefined)
      e.target.value = ''
    }
  }

  return (
    <>
      <UploadDialogFrame
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        buttonLabel="Select image to generate favicons"
        description={toolEntry?.description}
        onAfterClose={onAfterDialogClose}
        onReset={resetState}
        onUpload={handleUpload}
        title="Favicon Generator"
        uploadInputName="favicon-source"
      >
        <div className="flex grow flex-col gap-6 overflow-y-auto">
          {/* Source + Generated grid */}
          <div className="flex flex-col gap-6 tablet:flex-row">
            {/* Source image */}
            {sourcePreview && (
              <div className="flex shrink-0 flex-col items-center gap-2">
                <p className="text-body-sm font-medium text-gray-300">Source Image</p>
                <img alt="source" className="w-full max-w-40 rounded border border-gray-800" src={sourcePreview} />
                <Button icon={<RefreshIcon />} onClick={handleNewUpload} size="small">
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
                      onClick={() => handleDownloadSingle(result)}
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

            {processing && (
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

      <input
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </>
  )
}
