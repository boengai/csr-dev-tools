import { useReducer, useRef } from 'react'

import { Button, ColorInput, CopyButton, DownloadIcon, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { QrCodeAction, QrCodeState, QrErrorCorrectionLevel, QrInput, QrResult, ToolComponentProps } from '@/types'
import { generateQrCodeDataUrl, generateQrCodeSvgString } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['qr-code-generator']
const initialState: QrCodeState = {
  background: '#ffffff',
  errorCorrection: 'M',
  foreground: '#000000',
  size: 256,
  text: '',
}

const reducer = (state: QrCodeState, action: QrCodeAction): QrCodeState => {
  switch (action.type) {
    case 'SET_BACKGROUND':
      return { ...state, background: action.payload }
    case 'SET_ERROR_CORRECTION':
      return { ...state, errorCorrection: action.payload }
    case 'SET_FOREGROUND':
      return { ...state, foreground: action.payload }
    case 'SET_SIZE':
      return { ...state, size: action.payload }
    case 'SET_TEXT':
      return { ...state, text: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const EMPTY_RESULT: QrResult = { dataUrl: '', svgString: '' }

export const QrCodeGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { background, errorCorrection, foreground, size, text } = state
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const { toast } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<QrInput, QrResult>(
    async ({ text: t, size: s, errorCorrection: ec, foreground: fg, background: bg }) => {
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
      return { dataUrl: url, svgString: svg }
    },
    {
      debounceMs: 300,
      initial: EMPTY_RESULT,
      isEmpty: ({ text: t }) => !t,
      onError: () => {
        toast({
          action: 'add',
          item: { label: 'Failed to generate QR code', type: 'error' },
        })
      },
    },
  )

  const { dataUrl, svgString } = result

  const handleTextChange = (val: string) => {
    dispatch({ type: 'SET_TEXT', payload: val })
    setInput({ text: val, size, errorCorrection, foreground, background })
  }

  const handleSizeChange = (val: string) => {
    const n = Number(val)
    dispatch({ type: 'SET_SIZE', payload: n })
    setInputImmediate({ text, size: n, errorCorrection, foreground, background })
  }

  const handleEcChange = (val: string) => {
    const ec = val as QrErrorCorrectionLevel
    dispatch({ type: 'SET_ERROR_CORRECTION', payload: ec })
    setInputImmediate({ text, size, errorCorrection: ec, foreground, background })
  }

  const handleFgChange = (val: string) => {
    dispatch({ type: 'SET_FOREGROUND', payload: val })
    setInputImmediate({ text, size, errorCorrection, foreground: val, background })
  }

  const handleBgChange = (val: string) => {
    dispatch({ type: 'SET_BACKGROUND', payload: val })
    setInputImmediate({ text, size, errorCorrection, foreground, background: val })
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
    dispatch({ type: 'RESET' })
    setInputImmediate({
      text: '',
      size: initialState.size,
      errorCorrection: initialState.errorCorrection,
      foreground: initialState.foreground,
      background: initialState.background,
    })
  }

  return (
    <>
      <ToolDialogFrame
        autoOpen={autoOpen}
        description={toolEntry?.description}
        onAfterClose={onAfterDialogClose}
        onReset={handleReset}
        title="QR Code Generator"
        triggers={[{ label: 'Generate QR Code' }]}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
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
                  <ColorInput id="qr-fg" onChange={handleFgChange} value={foreground} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-body-sm font-medium text-gray-400" htmlFor="qr-bg">
                    Background
                  </label>
                  <ColorInput id="qr-bg" onChange={handleBgChange} value={background} />
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-4">
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
      </ToolDialogFrame>
      <a aria-hidden="true" className="hidden" download href="about:blank" ref={downloadAnchorRef} tabIndex={-1} />
    </>
  )
}
