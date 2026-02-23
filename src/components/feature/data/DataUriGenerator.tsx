import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { DataUriDecodeResult, DataUriEncodeResult } from '@/utils'

import { Button, CopyButton, Dialog, DownloadIcon, FieldForm, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { fileToDataUri, formatFileSize, isValidDataUri, parseDataUri, parseDataUrlToBlob } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['data-uri-generator']

const getMimeExtension = (mimeType: string): string => {
  const sub = mimeType.split('/')[1] ?? 'bin'
  if (sub === 'svg+xml') return 'svg'
  if (sub === 'javascript') return 'js'
  if (sub === 'plain') return 'txt'
  return sub
}

export const DataUriGenerator = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [encodeOpen, setEncodeOpen] = useState(false)
  const [decodeOpen, setDecodeOpen] = useState(false)
  const [encodeResult, setEncodeResult] = useState<DataUriEncodeResult | null>(null)
  const [decodeInput, setDecodeInput] = useState('')
  const [decodeResult, setDecodeResult] = useState<DataUriDecodeResult | null>(null)
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    try {
      const result = await fileToDataUri(file)
      setEncodeResult(result)
      setEncodeOpen(true)

      if (result.isLargeFile) {
        toast({
          action: 'add',
          item: {
            label: 'File exceeds 30 KB — consider using a regular file reference for better performance',
            type: 'error',
          },
        })
      }
    } catch {
      toast({
        action: 'add',
        item: { label: 'Failed to read file', type: 'error' },
      })
    }
  }

  const processDecodeInput = useDebounceCallback((val: string) => {
    if (!val.trim()) {
      setDecodeResult(null)
      return
    }

    if (!isValidDataUri(val.trim())) {
      setDecodeResult(null)
      toast({
        action: 'add',
        item: { label: 'Invalid data URI format (e.g., data:image/png;base64,...)', type: 'error' },
      })
      return
    }

    try {
      const result = parseDataUri(val.trim())
      setDecodeResult(result)
    } catch {
      setDecodeResult(null)
      toast({
        action: 'add',
        item: { label: 'Invalid data URI format (e.g., data:image/png;base64,...)', type: 'error' },
      })
    }
  }, 300)

  const handleDecodeInputChange = (val: string) => {
    setDecodeInput(val)
    processDecodeInput(val)
  }

  const handleDownload = async () => {
    if (!decodeResult || !decodeInput.trim()) return
    const anchor = downloadAnchorRef.current
    if (!anchor) return

    try {
      const blob = await parseDataUrlToBlob(decodeInput.trim())
      const ext = getMimeExtension(decodeResult.mimeType)
      const url = URL.createObjectURL(blob)
      anchor.href = url
      anchor.download = `decoded.${ext}`
      anchor.click()
      URL.revokeObjectURL(url)
      toast({
        action: 'add',
        item: { label: `Downloaded decoded.${ext}`, type: 'success' },
      })
    } catch {
      toast({
        action: 'add',
        item: { label: 'Failed to download file', type: 'error' },
      })
    }
  }

  const handleEncodeReset = () => {
    setEncodeResult(null)
  }

  const handleDecodeReset = () => {
    setDecodeInput('')
    setDecodeResult(null)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="w-full desktop:w-8/10">
          <UploadInput
            accept="*/*"
            button={{ block: true, children: 'Select file to encode' }}
            multiple={false}
            name="data-uri-encode"
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button aria-label="Open decode data URI dialog" block onClick={() => setDecodeOpen(true)} variant="default">
            Decode Data URI
          </Button>
        </div>
      </div>

      {/* Encode Dialog */}
      <Dialog
        injected={{ open: encodeOpen, setOpen: setEncodeOpen }}
        onAfterClose={() => {
          handleEncodeReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="File to Data URI"
      >
        {encodeResult && (
          <div className="flex w-full grow flex-col gap-4">
            <div className="flex items-start gap-4">
              {encodeResult.isImage && (
                <img
                  alt={`Preview of ${encodeResult.mimeType} file`}
                  className="max-h-24 max-w-24 shrink-0 rounded-lg border border-gray-800 object-contain"
                  src={encodeResult.dataUri}
                />
              )}
              <div className="flex flex-col gap-1">
                <p className="text-body-sm text-gray-300">
                  {encodeResult.fileName} — {encodeResult.mimeType}
                </p>
                <p className="text-body-xs text-gray-500">
                  Original: {formatFileSize(encodeResult.originalSize)} — Encoded:{' '}
                  {formatFileSize(encodeResult.encodedSize)}
                </p>
                {encodeResult.isLargeFile && (
                  <p className="text-amber-400 text-body-xs">
                    File exceeds 30 KB — consider using a regular file reference for better performance
                  </p>
                )}
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
                      <CopyButton label="data URI" value={encodeResult.dataUri} />
                    </span>
                  }
                  name="data-uri-output"
                  placeholder=""
                  rows={4}
                  type="textarea"
                  value={encodeResult.dataUri}
                />
              </div>

              {encodeResult.htmlImgTag && (
                <div className="flex min-h-0 flex-col gap-2">
                  <FieldForm
                    disabled
                    label={
                      <span className="flex items-center gap-1">
                        <span>HTML &lt;img&gt; Tag</span>
                        <CopyButton label="HTML tag" value={encodeResult.htmlImgTag} />
                      </span>
                    }
                    name="html-img-tag"
                    placeholder=""
                    rows={3}
                    type="textarea"
                    value={encodeResult.htmlImgTag}
                  />
                </div>
              )}

              {encodeResult.cssUrl && (
                <div className="flex min-h-0 flex-col gap-2">
                  <FieldForm
                    disabled
                    label={
                      <span className="flex items-center gap-1">
                        <span>CSS url()</span>
                        <CopyButton label="CSS url()" value={encodeResult.cssUrl} />
                      </span>
                    }
                    name="css-url"
                    placeholder=""
                    rows={3}
                    type="textarea"
                    value={encodeResult.cssUrl}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Decode Dialog */}
      <Dialog
        injected={{ open: decodeOpen, setOpen: setDecodeOpen }}
        onAfterClose={() => {
          handleDecodeReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="Decode Data URI"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Data URI"
                name="decode-input"
                onChange={handleDecodeInputChange}
                placeholder="Paste data URI (e.g., data:image/png;base64,...)"
                rows={12}
                type="textarea"
                value={decodeInput}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col items-center gap-4">
              {decodeResult ? (
                <>
                  {decodeResult.isImage && decodeResult.previewUri && (
                    <img
                      alt={`Preview of ${decodeResult.mimeType} file`}
                      className="max-h-80 max-w-full rounded-lg object-contain"
                      src={decodeResult.previewUri}
                    />
                  )}
                  <div className="flex flex-col gap-1 text-center">
                    <p className="text-body-sm text-gray-300">MIME Type: {decodeResult.mimeType}</p>
                    <p className="text-body-xs text-gray-500">
                      Encoding: {decodeResult.encoding} — Decoded size: {formatFileSize(decodeResult.decodedSize)}
                    </p>
                  </div>
                  <Button
                    aria-label="Download decoded file"
                    block
                    icon={<DownloadIcon />}
                    onClick={handleDownload}
                    variant="primary"
                  >
                    Download
                  </Button>
                </>
              ) : (
                <p className="text-body-sm text-gray-500">Paste a data URI to decode and preview</p>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      <a className="hidden" ref={downloadAnchorRef} />
    </>
  )
}
