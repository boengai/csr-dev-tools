import { useRef, useState } from 'react'

import type { Base64ImageInfo } from '@/utils/base64-image'

import { Button, Dialog, DownloadIcon, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { formatFileSize } from '@/utils'
import { base64ToImageInfo } from '@/utils/base64-image'

const toolEntry = TOOL_REGISTRY_MAP['base64-to-image']

export const Base64ToImage = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [input, setInput] = useState('')
  const [info, setInfo] = useState<Base64ImageInfo | null>(null)
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const { toast } = useToast()

  const processInput = useDebounceCallback(async (val: string) => {
    if (!val.trim()) {
      setInfo(null)
      return
    }
    try {
      const result = await base64ToImageInfo(val.trim())
      setInfo(result)
    } catch {
      setInfo(null)
      toast({
        action: 'add',
        item: { label: 'Invalid Base64 image data', type: 'error' },
      })
    }
  }, 500)

  const handleInputChange = (val: string) => {
    setInput(val)
    processInput(val)
  }

  const handleDownload = () => {
    if (!info) return
    const anchor = downloadAnchorRef.current
    if (!anchor) return
    anchor.href = info.dataUri
    anchor.download = `image.${info.format}`
    anchor.click()
    toast({
      action: 'add',
      item: { label: `Downloaded image.${info.format}`, type: 'success' },
    })
  }

  const handleReset = () => {
    setInput('')
    setInfo(null)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Convert Base64 to Image
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title="Base64 to Image"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
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

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col items-center gap-4">
              {info ? (
                <>
                  <img
                    alt="Decoded image"
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
      </Dialog>
      <a className="hidden" download="" href="" ref={downloadAnchorRef} />
    </>
  )
}
