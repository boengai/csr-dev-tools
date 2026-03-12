import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'

import { Button, CopyButton, Dialog, DownloadIcon, RefreshIcon, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { downloadFaviconsAsZip, type FaviconResult, generateFaviconLinkTags, generateFavicons } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['favicon-generator']
const linkTags = generateFaviconLinkTags()

export const FaviconGenerator = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [results, setResults] = useState<Array<FaviconResult>>([])
  const [sourcePreview, setSourcePreview] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = useCallback(
    async (files: Array<File>) => {
      const file = files[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast({ action: 'add', item: { label: 'Please select an image file', type: 'error' } })
        return
      }

      try {
        setProcessing(true)
        setDialogOpen(true)

        const url = URL.createObjectURL(file)
        setSourcePreview(url)

        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to load image'))
          img.src = url
        })

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
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.size.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetState = () => {
    if (sourcePreview) {
      URL.revokeObjectURL(sourcePreview)
    }
    setResults([])
    setSourcePreview('')
    setProcessing(false)
  }

  const handleNewUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      resetState()
      handleUpload(Array.from(files))
      e.target.value = ''
    }
  }

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (sourcePreview) {
        URL.revokeObjectURL(sourcePreview)
      }
    }
  }, [sourcePreview])

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          <UploadInput
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            button={{ block: true, children: 'Select image to generate favicons' }}
            multiple={false}
            name="favicon-source"
            onChange={handleUpload}
          />
        </div>
      </div>

      <input
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileInputChange}
        ref={fileInputRef}
        type="file"
      />

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          resetState()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="Favicon Generator"
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
      </Dialog>
    </>
  )
}
