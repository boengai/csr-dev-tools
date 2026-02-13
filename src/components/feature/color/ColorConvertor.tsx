import { motion } from 'motion/react'
import { type PropsWithChildren, useState } from 'react'

import type { ColorFormat } from '@/types'

import { CopyButton, FieldForm, NotoEmoji } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { convertColor } from '@/utils/color'

const randomByte = () => Math.floor(Math.random() * 256)

const emptyColors: Record<ColorFormat, string> = {
  hex: '',
  hsl: '',
  lab: '',
  lch: '',
  oklch: '',
  rgb: '',
}

const ERROR_MESSAGES: Record<ColorFormat, string> = {
  hex: 'Enter a valid hex color (e.g., #3B82F6)',
  hsl: 'Enter a valid HSL color (e.g., hsl(217 91% 60%))',
  lab: 'Enter a valid LAB color (e.g., lab(54 -4 49))',
  lch: 'Enter a valid LCH color (e.g., lch(54 49 97))',
  oklch: 'Enter a valid OKLCH color (e.g., oklch(0.65 0.20 260))',
  rgb: 'Enter a valid RGB color (e.g., rgb(59, 130, 246))',
}

const FORMATS: Array<{ format: ColorFormat; label: string; placeholder: string }> = [
  { format: 'hex', label: 'Hex', placeholder: '#000 or #000000' },
  { format: 'rgb', label: 'RGB', placeholder: 'rgb(0, 0, 0)' },
  { format: 'oklch', label: 'OKLCH', placeholder: 'oklch(0 0 0)' },
  { format: 'hsl', label: 'HSL', placeholder: 'hsl(0 0% 0%)' },
  { format: 'lab', label: 'LAB', placeholder: 'lab(0 0 0)' },
  { format: 'lch', label: 'LCH', placeholder: 'lch(0 0 0)' },
]

const InputWrapper = ({ children, color }: PropsWithChildren<{ color: string }>) => {
  return (
    <div className="flex w-full items-end gap-2">
      {color ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="size-10 shrink-0 rounded shadow"
          initial={{ opacity: 0, scale: 0.8 }}
          key={color}
          style={{ backgroundColor: color }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      ) : (
        <NotoEmoji emoji="thinking-face" size={40} />
      )}
      {children}
    </div>
  )
}

const toolEntry = TOOL_REGISTRY_MAP['color-converter']

export const ColorConvertor = () => {
  const [color, setColor] = useState<Record<ColorFormat, string>>(
    convertColor(`rgb(${randomByte()}, ${randomByte()}, ${randomByte()})`, 'rgb'),
  )
  const { clearError, error, setError } = useToolError()

  const dbConvertColor = useDebounceCallback((source: Record<ColorFormat, string>, format: ColorFormat) => {
    const value = source[format]
    if (!value.trim()) {
      clearError()
      return
    }

    try {
      const convertedColors = convertColor(value, format)
      setColor(convertedColors)
      clearError()
    } catch {
      setError(ERROR_MESSAGES[format])
      setColor({ ...emptyColors, [format]: value })
    }
  }, 150)

  const handleColorChange = (format: ColorFormat, value: string) => {
    setColor((prev) => ({ ...prev, [format]: value }))
    dbConvertColor({ ...color, [format]: value }, format)
  }

  const handlePickerChange = (hex: string) => {
    try {
      const converted = convertColor(hex, 'hex')
      setColor(converted)
      clearError()
    } catch {
      setError(ERROR_MESSAGES.hex)
    }
  }

  return (
    <div className="flex size-full grow flex-col gap-2">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <input
        aria-label="Color picker"
        className="h-10 w-full shrink-0 cursor-pointer rounded border border-gray-700 bg-transparent p-1 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
        onChange={(e) => handlePickerChange(e.target.value)}
        type="color"
        value={color.hex || '#000000'}
      />

      {FORMATS.map(({ format, label, placeholder }) => (
        <InputWrapper key={format} color={color[format]}>
          <FieldForm
            label={label}
            name={format}
            onChange={(val) => handleColorChange(format, val)}
            placeholder={placeholder}
            suffix={<CopyButton label={label} value={color[format]} />}
            type="text"
            value={color[format]}
          />
        </InputWrapper>
      ))}

      {error != null && (
        <p className="text-error text-body-sm shrink-0" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
