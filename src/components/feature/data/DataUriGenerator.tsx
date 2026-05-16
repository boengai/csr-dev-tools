import { useState } from 'react'

import { Button, CopyButton, DownloadIcon, FieldForm, UploadInput } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { DataUriDecodeResult, DataUriEncodeResult, ToolComponentProps } from '@/types'
import { fileToDataUri, formatFileSize, parseDataUri, parseDataUrlToBlob } from '@/utils'
import { downloadBlob } from '@/utils/download'

const toolEntry = TOOL_REGISTRY_MAP['data-uri-generator']

const getMimeExtension = (mimeType: string): string => {
  const sub = mimeType.split('/')[1] ?? 'bin'
  if (sub === 'svg+xml') return 'svg'
  if (sub === 'javascript') return 'js'
  if (sub === 'plain') return 'txt'
  return sub
}

export const DataUriGenerator = ({ onAfterDialogClose }: ToolComponentProps) => {
  const { showError, showSuccess } = useToast()

  const [encodeOpen, setEncodeOpen] = useState(false)
  const [decodeOpen, setDecodeOpen] = useState(false)
  const [encodeResult, setEncodeResult] = useState<DataUriEncodeResult | null>(null)
  const [decodeInput, setDecodeInputValue] = useState('')

  const {
    result: decodeResult,
    setInput: setDecodeInput,
    setInputImmediate: setDecodeInputImmediate,
  } = useToolComputation<string, DataUriDecodeResult | null>((val) => parseDataUri(val.trim()), {
    debounceMs: 300,
    initial: null,
    isEmpty: (val) => !val.trim(),
    onError: () => showError('Invalid data URI format (e.g., data:image/png;base64,...)'),
  })

  const handleFileUpload = async (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    try {
      const result = await fileToDataUri(file)
      setEncodeResult(result)
      setEncodeOpen(true)
      if (result.isLargeFile) {
        showError('File exceeds 30 KB — consider using a regular file reference for better performance')
      }
    } catch {
      showError('Failed to read file')
    }
  }

  const handleDecodeInputChange = (val: string) => {
    setDecodeInputValue(val)
    setDecodeInput(val)
  }

  const handleDownload = async () => {
    if (!decodeResult || !decodeInput.trim()) return

    try {
      const blob = await parseDataUrlToBlob(decodeInput.trim())
      const ext = getMimeExtension(decodeResult.mimeType)
      downloadBlob(blob, `decoded.${ext}`)
      showSuccess(`Downloaded decoded.${ext}`)
    } catch {
      showError('Failed to download file')
    }
  }

  const handleEncodeReset = () => {
    setEncodeResult(null)
  }

  const handleDecodeReset = () => {
    setDecodeInputValue('')
    setDecodeInputImmediate('')
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <UploadInput
            accept="*/*"
            button={{ block: true, children: 'Select file to encode' }}
            multiple={false}
            name="data-uri-encode"
            onChange={handleFileUpload}
          />
          <Button aria-label="Open decode data URI dialog" block onClick={() => setDecodeOpen(true)} variant="default">
            Decode Data URI
          </Button>
        </div>
      </div>

      {/* Encode Dialog */}
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setEncodeOpen}
        onReset={handleEncodeReset}
        open={encodeOpen}
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

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
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
      </ToolDialogShell>

      {/* Decode Dialog */}
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDecodeOpen}
        onReset={handleDecodeReset}
        open={decodeOpen}
        size="screen"
        title="Decode Data URI"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-4">
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
      </ToolDialogShell>
    </>
  )
}
