import { ColorInput, FieldForm, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { QrErrorCorrectionLevel, QrInput, ToolComponentProps, TransformerImage } from '@/types'
import { generateQrCodeDataUrl, generateQrCodeSvgString } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['qr-code-generator']

const INITIAL: QrInput = {
  background: '#ffffff',
  errorCorrection: 'M',
  foreground: '#000000',
  size: 256,
  source: '',
}

const computeQr = async ({
  background,
  errorCorrection,
  foreground,
  size,
  source,
}: QrInput): Promise<TransformerImage> => {
  const options = { background, errorCorrectionLevel: errorCorrection, foreground, size }
  const [src, svg] = await Promise.all([
    generateQrCodeDataUrl(source, options),
    generateQrCodeSvgString(source, options),
  ])
  return { alt: 'QR Code', copy: svg, filename: 'qr-code.png', src }
}

// Same text and options give the same code, so it is a Transformer: it
// redraws as you type. Download (PNG) and Copy (SVG) both sit in the label.
export const QrCodeGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<QrInput, 'image'>
    autoOpen={autoOpen}
    compute={computeQr}
    description={toolEntry?.description}
    errorLabel="Unable to make a QR code from this text — it may be too long"
    imageCopyLabel="SVG"
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="image"
    // Never saved before the shell (a QR text can be a Wi-Fi password); kept that way.
    persistInput={false}
    renderControls={({ inputs, setFields, setFieldsImmediate }) => (
      <>
        <div className="w-48">
          {/* Debounced: dragging fires a change per frame, and each redraw
              allocates a large PNG data URL. The label still tracks the thumb. */}
          <FieldForm
            label={`Size: ${inputs.size}px`}
            max={512}
            min={128}
            name="qr-size"
            onChange={(val: string) => setFields({ size: Number(val) })}
            type="range"
            value={String(inputs.size)}
          />
        </div>
        <FieldForm
          label="Error Correction"
          name="qr-ec"
          onChange={(val: string) => setFieldsImmediate({ errorCorrection: val as QrErrorCorrectionLevel })}
          options={[
            { label: 'Low (L)', value: 'L' },
            { label: 'Medium (M)', value: 'M' },
            { label: 'Quartile (Q)', value: 'Q' },
            { label: 'High (H)', value: 'H' },
          ]}
          type="select"
          value={inputs.errorCorrection}
        />
        <div className="flex flex-col gap-1">
          <label className="text-body-sm font-medium text-gray-400" htmlFor="qr-fg">
            Foreground
          </label>
          <ColorInput
            id="qr-fg"
            onChange={(val: string) => setFieldsImmediate({ foreground: val })}
            value={inputs.foreground}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-body-sm font-medium text-gray-400" htmlFor="qr-bg">
            Background
          </label>
          <ColorInput
            id="qr-bg"
            onChange={(val: string) => setFieldsImmediate({ background: val })}
            value={inputs.background}
          />
        </div>
      </>
    )}
    resultLabel="QR Code"
    resultPlaceholder="Type text or a URL on the left to make its QR code"
    sourceKind="text"
    sourceLabel="Text or URL"
    sourcePlaceholder="https://example.com"
    title="QR Code Generator"
    triggerLabel="Generate QR Code"
  />
)
