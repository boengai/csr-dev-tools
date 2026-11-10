import { ColorInput, CopyButton, FieldForm, GeneratorShell, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { GeneratorSwatches, PaletteInput, ToolComponentProps } from '@/types'
import { formatPaletteAsCss, generatePalette, type HarmonyType, type PaletteColor } from '@/utils'

const HARMONY_OPTIONS: Array<{ label: string; value: HarmonyType }> = [
  { label: 'Analogous', value: 'analogous' },
  { label: 'Complementary', value: 'complementary' },
  { label: 'Triadic', value: 'triadic' },
  { label: 'Split-Complementary', value: 'split-complementary' },
  { label: 'Monochromatic', value: 'monochromatic' },
]

const INITIAL: PaletteInput = { harmony: 'analogous', hex: '#3b82f6' }
const HEX_PATTERN = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const INVALID_HEX = 'Enter a valid hex color (e.g., #3B82F6)'

const toPickerHex = (hex: string): string => {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const m = hex.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/)
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : '#000000'
}

const formatHsl = (hsl: PaletteColor['hsl']) => `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`

// Deterministic: the same colour and harmony always give the same palette, so
// it runs live. A bad hex (typed, or corrupt saved options) is an input error
// for the status slot.
const generate = async ({ harmony, hex }: PaletteInput): Promise<GeneratorSwatches> => {
  if (typeof hex !== 'string' || !HEX_PATTERN.test(hex.trim())) throw new Error(INVALID_HEX)
  if (!HARMONY_OPTIONS.some((o) => o.value === harmony)) throw new Error('Pick a harmony type')
  let palette: Array<PaletteColor>
  try {
    palette = await generatePalette(hex.trim(), harmony)
  } catch {
    throw new Error(INVALID_HEX)
  }
  return {
    copyAll: formatPaletteAsCss(palette),
    swatches: palette.map((color) => ({
      color: color.hex,
      details: [color.hex, color.rgb, formatHsl(color.hsl)],
      value: color.hex,
    })),
  }
}

const toolEntry = TOOL_REGISTRY_MAP['color-palette-generator']

export const ColorPaletteGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={generate}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    output={{
      copyAllLabel: 'palette as CSS',
      itemLabel: 'color',
      kind: 'swatches',
      label: 'Palette',
      placeholder: 'Pick a base color to generate a palette',
    }}
    renderOptions={({ options, setOptions, setOptionsDebounced }) => (
      <>
        <ColorInput
          aria-label="Color picker"
          onChange={(hex: string) => setOptionsDebounced({ hex })}
          size="full"
          value={toPickerHex(typeof options.hex === 'string' ? options.hex : '')}
        />

        <FieldForm
          label="Hex Color"
          name="hex-color"
          onChange={(hex: string) => setOptionsDebounced({ hex })}
          placeholder="#3b82f6"
          suffix={<CopyButton label="Hex" value={String(options.hex ?? '')} />}
          type="text"
          value={String(options.hex ?? '')}
        />

        <SelectInput
          aria-label="Harmony type"
          name="harmony-type"
          onChange={(value: string) => setOptions({ harmony: value as HarmonyType })}
          options={HARMONY_OPTIONS}
          value={options.harmony}
        />
      </>
    )}
    run={{ mode: 'live' }}
    storageKey="csr-dev-tools-color-palette-generator"
    title="Color Palette Generator"
    triggerLabel="Generate"
  />
)
