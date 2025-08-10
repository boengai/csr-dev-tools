import { motion } from 'motion/react'
import { type Dispatch, type MouseEvent, type PropsWithChildren, type SetStateAction, useState } from 'react'

import { Button, Card, CopyIcon, NotoEmoji } from '@/components/common'
import { FieldForm } from '@/components/common/form/FieldForm'
import { useCopyToClipboard } from '@/hooks'
import { type ColorFormat, type UseCopyToClipboard } from '@/types'
import { convertColor } from '@/utils/color'

const CopyButton = ({ value }: { value: string }) => {
  const copyToClipboard: UseCopyToClipboard = useCopyToClipboard()

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    copyToClipboard(value)
  }

  return (
    <Button onClick={handleClick} variant="text">
      <CopyIcon />
    </Button>
  )
}

const InputWrapper = ({ children, color: color }: PropsWithChildren<{ color: string }>) => {
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

export const ColorConvertorCard = () => {
  // states
  const [color, setColor]: [Record<ColorFormat, string>, Dispatch<SetStateAction<Record<ColorFormat, string>>>] =
    useState<Record<ColorFormat, string>>({
      hex: '#c08081',
      hsl: 'hsl(359.06 33.68% 62.75%)',
      lab: 'lab(60.10 24.90 9.63)',
      lch: 'lch(60.10 26.70 21.15)',
      oklch: 'oklch(0.6655 0.0797 18.38)',
      rgb: 'rgb(192, 128, 129)',
    })

  // Handle color input changes and convert to all formats
  const handleColorBlur = (format: ColorFormat) => {
    const value: string = color[format]
    if (!value.trim()) return

    try {
      const convertedColors: Record<ColorFormat, string> = convertColor(value, format)
      setColor(convertedColors)
    } catch {
      setColor({
        ...{
          hex: '',
          hsl: '',
          lab: '',
          lch: '',
          oklch: '',
          rgb: '',
        },
        [format]: value,
      })
    }
  }

  return (
    <Card title="Color Convertor">
      <div className="flex w-full grow flex-col items-center justify-center gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center gap-4">
          <InputWrapper color={color.hex}>
            <FieldForm
              label="Hex"
              name="hex"
              onBlur={() => handleColorBlur('hex')}
              onChange={(val: string) => setColor((prev: Record<ColorFormat, string>) => ({ ...prev, hex: val }))}
              placeholder="#000 or #000000"
              suffix={<CopyButton value={color.hex} />}
              type="text"
              value={color.hex}
            />
          </InputWrapper>
          <InputWrapper color={color.rgb}>
            <FieldForm
              label="RGB"
              name="rgb"
              onBlur={() => handleColorBlur('rgb')}
              onChange={(val: string) => setColor((prev: Record<ColorFormat, string>) => ({ ...prev, rgb: val }))}
              placeholder="rgb(0, 0, 0)"
              suffix={<CopyButton value={color.rgb} />}
              type="text"
              value={color.rgb}
            />
          </InputWrapper>
          <InputWrapper color={color.oklch}>
            <FieldForm
              label="OKLCH"
              name="oklch"
              onBlur={() => handleColorBlur('oklch')}
              onChange={(val: string) => setColor((prev: Record<ColorFormat, string>) => ({ ...prev, oklch: val }))}
              placeholder="oklch(0 0 0)"
              suffix={<CopyButton value={color.oklch} />}
              type="text"
              value={color.oklch}
            />
          </InputWrapper>
          <InputWrapper color={color.hsl}>
            <FieldForm
              label="HSL"
              name="hsl"
              onBlur={() => handleColorBlur('hsl')}
              onChange={(val: string) => setColor((prev: Record<ColorFormat, string>) => ({ ...prev, hsl: val }))}
              placeholder="hsl(0 0% 0%)"
              suffix={<CopyButton value={color.hsl} />}
              type="text"
              value={color.hsl}
            />
          </InputWrapper>
          <InputWrapper color={color.lab}>
            <FieldForm
              label="LAB"
              name="lab"
              onBlur={() => handleColorBlur('lab')}
              onChange={(val: string) => setColor((prev: Record<ColorFormat, string>) => ({ ...prev, lab: val }))}
              placeholder="lab(0 0 0)"
              suffix={<CopyButton value={color.lab} />}
              type="text"
              value={color.lab}
            />
          </InputWrapper>
          <InputWrapper color={color.lch}>
            <FieldForm
              label="LCH"
              name="lch"
              onBlur={() => handleColorBlur('lch')}
              onChange={(val: string) => setColor((prev: Record<ColorFormat, string>) => ({ ...prev, lch: val }))}
              placeholder="lch(0 0 0)"
              suffix={<CopyButton value={color.lch} />}
              type="text"
              value={color.lch}
            />
          </InputWrapper>
        </div>
      </div>
    </Card>
  )
}
