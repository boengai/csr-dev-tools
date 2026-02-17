import { useCallback, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, DownloadIcon, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { generateQrCodeDataUrl, generateQrCodeSvgString } from '@/utils/qr-code'

const toolEntry = TOOL_REGISTRY_MAP['qr-code-generator']

export const QrCodeGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [text, setText] = useState('')
  const [size, setSize] = useState(256)
  const [errorCorrection, setErrorCorrection] = useState<'H' | 'L' | 'M' | 'Q'>('M')
  const [foreground, setForeground] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')
  const [dataUrl, setDataUrl] = useState('')
  const [svgString, setSvgString] = useState('')
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const { toast } = useToast()

  const generate = useCallback(
    async (t: string, s: number, ec: 'H' | 'L' | 'M' | 'Q', fg: string, bg: string) => {
      if (!t) {
        setDataUrl('')
        setSvgString('')
        return
      }
      try {
        const [url, svg] = await Promise.all([
          generateQrCodeDataUrl(t, {
            background: bg,
            errorCorrectionLevel: ec,
            foreground: fg,
            size: s,
          }),
          generateQrCodeSvgString(t, {
            background: bg,
            errorCorrectionLevel: ec,
            foreground: fg,
            size: s,
          }),
        ])
        setDataUrl(url)
        setSvgString(svg)
      } catch {
        toast({
          action: 'add',
          item: { label: 'Failed to generate QR code', type: 'error' },
        })
      }
    },
    [toast],
  )

  const debouncedGenerate = useDebounceCallback(generate, 300)

  const handleTextChange = (val: string) => {
    setText(val)
    debouncedGenerate(val, size, errorCorrection, foreground, background)
  }

  const handleSizeChange = (val: string) => {
    const n = Number(val)
    setSize(n)
    debouncedGenerate(text, n, errorCorrection, foreground, background)
  }

  const handleEcChange = (val: string) => {
    const ec = val as 'H' | 'L' | 'M' | 'Q'
    setErrorCorrection(ec)
    debouncedGenerate(text, size, ec, foreground, background)
  }

  const handleFgChange = (val: string) => {
    setForeground(val)
    debouncedGenerate(text, size, errorCorrection, val, background)
  }

  const handleBgChange = (val: string) => {
    setBackground(val)
    debouncedGenerate(text, size, errorCorrection, foreground, val)
  }

  const handleDownload = () => {
    if (!dataUrl) return
    const anchor = downloadAnchorRef.current
    if (!anchor) return
    anchor.href = dataUrl
    anchor.download = 'qr-code.png'
    anchor.click()
    toast({
      action: 'add',
      item: { label: 'Downloaded qr-code.png', type: 'success' },
    })
  }

  const handleReset = () => {
    setText('')
    setSize(256)
    setErrorCorrection('M')
    setForeground('#000000')
    setBackground('#ffffff')
    setDataUrl('')
    setSvgString('')
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Generate QR Code
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => { handleReset(); onAfterDialogClose?.() }}
        size="screen"
        title="QR Code Generator"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <FieldForm
                label="Text or URL"
                name="qr-text"
                onChange={handleTextChange}
                placeholder="https://example.com"
                rows={4}
                type="textarea"
                value={text}
              />

              <FieldForm
                label={`Size: ${size}px`}
                max={512}
                min={128}
                name="qr-size"
                onChange={handleSizeChange}
                type="range"
                value={String(size)}
              />

              <FieldForm
                label="Error Correction"
                name="qr-ec"
                onChange={handleEcChange}
                options={[
                  { label: 'Low (L)', value: 'L' },
                  { label: 'Medium (M)', value: 'M' },
                  { label: 'Quartile (Q)', value: 'Q' },
                  { label: 'High (H)', value: 'H' },
                ]}
                type="select"
                value={errorCorrection}
              />

              <div className="flex gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-body-sm font-medium text-gray-400" htmlFor="qr-fg">
                    Foreground
                  </label>
                  <input
                    className="h-10 w-20 cursor-pointer rounded border border-gray-800 bg-transparent"
                    id="qr-fg"
                    onChange={(e) => handleFgChange(e.target.value)}
                    type="color"
                    value={foreground}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-body-sm font-medium text-gray-400" htmlFor="qr-bg">
                    Background
                  </label>
                  <input
                    className="h-10 w-20 cursor-pointer rounded border border-gray-800 bg-transparent"
                    id="qr-bg"
                    onChange={(e) => handleBgChange(e.target.value)}
                    type="color"
                    value={background}
                  />
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col items-center gap-4">
              {dataUrl ? (
                <>
                  <img alt="QR Code" className="rounded-lg" height={size} src={dataUrl} width={size} />
                  <div className="flex w-full gap-2">
                    <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
                      Download PNG
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm text-gray-400">SVG</span>
                    <CopyButton label="SVG string" value={svgString} />
                  </div>
                </>
              ) : (
                <p className="text-body-sm text-gray-500">Enter text to generate a QR code</p>
              )}
            </div>
          </div>
        </div>
      </Dialog>
      <a className="hidden" download="" href="" ref={downloadAnchorRef} />
    </>
  )
}
