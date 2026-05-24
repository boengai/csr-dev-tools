import { m } from 'motion/react'

import { Button, ColorInput, CopyButton, FieldForm, SelectInput } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useCopyToClipboard, useToolFields } from '@/hooks'
import type { PaletteInput, ToolComponentProps } from '@/types'
import { formatPaletteAsCss, generatePalette, type HarmonyType, type PaletteColor } from '@/utils'

const HARMONY_OPTIONS: Array<{ label: string; value: HarmonyType }> = [
  { label: 'Analogous', value: 'analogous' },
  { label: 'Complementary', value: 'complementary' },
  { label: 'Triadic', value: 'triadic' },
  { label: 'Split-Complementary', value: 'split-complementary' },
  { label: 'Monochromatic', value: 'monochromatic' },
]

const DEFAULT_COLOR = '#3b82f6'
const DEFAULT_HARMONY: HarmonyType = 'analogous'

const toPickerHex = (hex: string): string => {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const m = hex.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/)
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : '#000000'
}

const toolEntry = TOOL_REGISTRY_MAP['color-palette-generator']

export const ColorPaletteGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const copyToClipboard = useCopyToClipboard()

  const {
    inputs,
    result: palette,
    setFields,
    setFieldsImmediate,
  } = useToolFields<PaletteInput, Array<PaletteColor>>({
    autorunOnMount: true,
    compute: ({ hex, harmony }) => generatePalette(hex, harmony),
    debounceMs: 300,
    errorLabel: 'Enter a valid hex color (e.g., #3B82F6)',
    initial: { hex: DEFAULT_COLOR, harmony: DEFAULT_HARMONY },
    initialResult: [],
    isEmpty: ({ hex }) => !hex.trim(),
  })
  const { hex: hexInput, harmony: harmonyType } = inputs

  const handleHexChange = (value: string) => setFields({ hex: value })
  const handlePickerChange = (hex: string) => setFields({ hex })
  const handleHarmonyChange = (value: string) => setFieldsImmediate({ harmony: value as HarmonyType })

  const handleCopyCss = () => copyToClipboard(formatPaletteAsCss(palette))

  const formatHsl = (hsl: PaletteColor['hsl']) =>
    `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      title="Color Palette Generator"
      triggers={[{ label: 'Generate' }]}
    >
      <div className="flex size-full grow flex-col gap-4">
        <div className="flex flex-col gap-3">
          <ColorInput
            aria-label="Color picker"
            onChange={handlePickerChange}
            size="full"
            value={toPickerHex(hexInput)}
          />

          <FieldForm
            label="Hex Color"
            name="hex-color"
            onChange={handleHexChange}
            placeholder="#3b82f6"
            suffix={<CopyButton label="Hex" value={hexInput} />}
            type="text"
            value={hexInput}
          />

          <SelectInput
            name="harmony-type"
            onChange={handleHarmonyChange}
            options={HARMONY_OPTIONS}
            value={harmonyType}
          />
        </div>

        <div aria-live="polite" className="flex flex-col gap-3">
          {palette.length > 0 && (
            <div className="grid grid-cols-1 gap-2 tablet:grid-cols-5">
              {palette.map((color, i) => (
                <m.button
                  animate={{ opacity: 1, scale: 1 }}
                  aria-label={`Copy color ${color.hex}`}
                  className="group focus-visible:ring-blue-500 relative flex min-h-24 cursor-pointer flex-col items-center justify-end overflow-hidden rounded-lg border border-gray-700 p-2 transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none"
                  initial={{ opacity: 0, scale: 0.9 }}
                  key={color.hex}
                  onClick={() => copyToClipboard(color.hex)}
                  style={{ backgroundColor: color.hex }}
                  tabIndex={0}
                  transition={{ delay: i * 0.05, duration: 0.2, ease: 'easeOut' }}
                  type="button"
                >
                  <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
                  <div className="relative z-10 flex flex-col items-center gap-0.5 text-center opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-body-xs font-medium text-white">
                      {color.hex}
                    </span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-body-xs text-white">{color.rgb}</span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-body-xs text-white">
                      {formatHsl(color.hsl)}
                    </span>
                  </div>
                </m.button>
              ))}
            </div>
          )}
        </div>

        {palette.length > 0 && (
          <Button aria-label="Export CSS custom properties" onClick={handleCopyCss} variant="primary">
            Export CSS
          </Button>
        )}
      </div>
    </ToolDialogFrame>
  )
}
