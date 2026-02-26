import { motion } from 'motion/react'
import { useState } from 'react'

import type { HarmonyType, PaletteColor } from '@/utils/color-palette'

import { Button, ColorInput, CopyButton, FieldForm, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useCopyToClipboard, useDebounceCallback, useToast } from '@/hooks'
import { formatPaletteAsCss, generatePalette } from '@/utils/color-palette'

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

export const ColorPaletteGenerator = () => {
  const [hexInput, setHexInput] = useState(DEFAULT_COLOR)
  const [harmonyType, setHarmonyType] = useState<HarmonyType>(DEFAULT_HARMONY)
  const [palette, setPalette] = useState<Array<PaletteColor>>(() => generatePalette(DEFAULT_COLOR, DEFAULT_HARMONY))
  const { toast } = useToast()
  const copyToClipboard = useCopyToClipboard()

  const updatePalette = (hex: string, harmony: HarmonyType) => {
    if (!hex.trim()) {
      setPalette([])
      return
    }
    try {
      setPalette(generatePalette(hex, harmony))
    } catch {
      toast({ action: 'add', item: { label: 'Enter a valid hex color (e.g., #3B82F6)', type: 'error' } })
      setPalette([])
    }
  }

  const debouncedUpdatePalette = useDebounceCallback((hex: string, harmony: HarmonyType) => {
    updatePalette(hex, harmony)
  }, 300)

  const handleHexChange = (value: string) => {
    setHexInput(value)
    debouncedUpdatePalette(value, harmonyType)
  }

  const handlePickerChange = (hex: string) => {
    setHexInput(hex)
    updatePalette(hex, harmonyType)
  }

  const handleHarmonyChange = (value: string) => {
    const harmony = value as HarmonyType
    setHarmonyType(harmony)
    updatePalette(hexInput, harmony)
  }

  const handleCopyCss = async () => {
    if (palette.length === 0) return
    const css = formatPaletteAsCss(palette)
    try {
      await navigator.clipboard.writeText(css)
      toast({ action: 'add', item: { label: 'CSS copied to clipboard', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Failed to copy to clipboard', type: 'error' } })
    }
  }

  const formatHsl = (hsl: PaletteColor['hsl']) =>
    `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`

  return (
    <div className="flex size-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <div className="flex flex-col gap-3">
        <ColorInput onChange={handlePickerChange} size="full" value={toPickerHex(hexInput)} />

        <FieldForm
          label="Hex Color"
          name="hex-color"
          onChange={handleHexChange}
          placeholder="#3b82f6"
          suffix={<CopyButton label="Hex" value={hexInput} />}
          type="text"
          value={hexInput}
        />

        <SelectInput name="harmony-type" onChange={handleHarmonyChange} options={HARMONY_OPTIONS} value={harmonyType} />
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {palette.length > 0 && (
          <div className="max-sm:grid-cols-1 grid grid-cols-5 gap-2">
            {palette.map((color, i) => (
              <motion.button
                animate={{ opacity: 1, scale: 1 }}
                aria-label={`Copy color ${color.hex}`}
                className="group focus-visible:ring-blue-500 relative flex min-h-24 cursor-pointer flex-col items-center justify-end overflow-hidden rounded-lg border border-gray-700 p-2 transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none"
                initial={{ opacity: 0, scale: 0.9 }}
                key={`${color.hex}-${i}`}
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
              </motion.button>
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
  )
}
