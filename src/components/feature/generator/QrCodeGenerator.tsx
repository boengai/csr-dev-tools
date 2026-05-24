import { Button, ColorInput, CopyButton, DownloadIcon, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDownload, useToolFields } from '@/hooks'
import type { QrErrorCorrectionLevel, QrInput, QrResult, ToolComponentProps } from '@/types'
import { generateQrCodeDataUrl, generateQrCodeSvgString } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['qr-code-generator']

// Seed with a real value so the dialog renders a working QR the moment it
// opens — the empty-state copy is reserved for the rare case the user clears
// the field, which is more meaningful than greeting first-time visitors with
// a "type something to see anything" wall.
const INITIAL_INPUT: QrInput = {
  background: '#ffffff',
  errorCorrection: 'M',
  foreground: '#000000',
  size: 256,
  text: 'https://example.com',
}

const EMPTY_RESULT: QrResult = { dataUrl: '', svgString: '' }

export const QrCodeGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { downloadDataUrl } = useDownload()

  const {
    inputs: { background, errorCorrection, foreground, size, text },
    reset,
    result: { dataUrl, svgString },
    setFields,
    setFieldsImmediate,
  } = useToolFields<QrInput, QrResult>({
    autorunOnMount: true,
    compute: async ({ background: bg, errorCorrection: ec, foreground: fg, size: s, text: t }) => {
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
    debounceMs: 300,
    errorLabel: 'Failed to generate QR code',
    initial: INITIAL_INPUT,
    initialResult: EMPTY_RESULT,
    isEmpty: ({ text: t }) => !t,
  })

  const handleTextChange = (val: string) => {
    setFields({ text: val })
  }

  const handleSizeChange = (val: string) => {
    setFieldsImmediate({ size: Number(val) })
  }

  const handleEcChange = (val: string) => {
    setFieldsImmediate({ errorCorrection: val as QrErrorCorrectionLevel })
  }

  const handleFgChange = (val: string) => {
    setFieldsImmediate({ foreground: val })
  }

  const handleBgChange = (val: string) => {
    setFieldsImmediate({ background: val })
  }

  const handleDownload = () => {
    if (!dataUrl) return
    downloadDataUrl(dataUrl, 'qr-code.png')
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="QR Code Generator"
      triggers={[{ label: 'Generate QR Code' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane gap="lg">
            <FieldForm
              label="Text or URL"
              name="qr-text"
              onChange={handleTextChange}
              placeholder="https://example.com"
              type="text"
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
          </Pane>

          <Pane align="center" gap="lg" live>
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
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
