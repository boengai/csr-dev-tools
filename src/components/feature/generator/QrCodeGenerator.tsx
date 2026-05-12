import { useCallback, useReducer, useRef } from 'react'

import { Button, ColorInput, CopyButton, Dialog, DownloadIcon, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { State, Action } from '@/types/components/feature/generator/qrCodeGenerator'
import { generateQrCodeDataUrl, generateQrCodeSvgString, type QrErrorCorrectionLevel } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['qr-code-generator']
const initialState: State = {
  background: '#ffffff',
  dataUrl: '',
  dialogOpen: false,
  errorCorrection: 'M',
  foreground: '#000000',
  size: 256,
  svgString: '',
  text: '',
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_BACKGROUND':
      return { ...state, background: action.payload }
    case 'SET_DATA_URL':
      return { ...state, dataUrl: action.payload }
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_ERROR_CORRECTION':
      return { ...state, errorCorrection: action.payload }
    case 'SET_FOREGROUND':
      return { ...state, foreground: action.payload }
    case 'SET_SIZE':
      return { ...state, size: action.payload }
    case 'SET_SVG_STRING':
      return { ...state, svgString: action.payload }
    case 'SET_TEXT':
      return { ...state, text: action.payload }
    case 'GENERATE_SUCCESS':
      return { ...state, dataUrl: action.payload.dataUrl, svgString: action.payload.svgString }
    case 'CLEAR_OUTPUT':
      return { ...state, dataUrl: '', svgString: '' }
    case 'RESET':
      return { ...initialState, dialogOpen: state.dialogOpen }
    default:
      return state
  }
}

export const QrCodeGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, { ...initialState, dialogOpen: autoOpen ?? false })
  const { background, dataUrl, dialogOpen, errorCorrection, foreground, size, svgString, text } = state
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const { toast } = useToast()

  const generate = useCallback(
    async (t: string, s: number, ec: QrErrorCorrectionLevel, fg: string, bg: string) => {
      if (!t) {
        dispatch({ type: 'CLEAR_OUTPUT' })
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
        dispatch({ type: 'GENERATE_SUCCESS', payload: { dataUrl: url, svgString: svg } })
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
    dispatch({ type: 'SET_TEXT', payload: val })
    debouncedGenerate(val, size, errorCorrection, foreground, background)
  }

  const handleSizeChange = (val: string) => {
    const n = Number(val)
    dispatch({ type: 'SET_SIZE', payload: n })
    debouncedGenerate(text, n, errorCorrection, foreground, background)
  }

  const handleEcChange = (val: string) => {
    const ec = val as QrErrorCorrectionLevel
    dispatch({ type: 'SET_ERROR_CORRECTION', payload: ec })
    debouncedGenerate(text, size, ec, foreground, background)
  }

  const handleFgChange = (val: string) => {
    dispatch({ type: 'SET_FOREGROUND', payload: val })
    debouncedGenerate(text, size, errorCorrection, val, background)
  }

  const handleBgChange = (val: string) => {
    dispatch({ type: 'SET_BACKGROUND', payload: val })
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
    dispatch({ type: 'RESET' })
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })} variant="default">
            Generate QR Code
          </Button>
        </div>
      </div>
      <Dialog
        injected={{
          open: dialogOpen,
          setOpen: (open: boolean) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open }),
        }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="QR Code Generator"
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
      </Dialog>
      <a aria-hidden="true" className="hidden" download href="about:blank" ref={downloadAnchorRef} tabIndex={-1} />
    </>
  )
}
