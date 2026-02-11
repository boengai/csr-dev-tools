import { motion } from 'motion/react'
import { type MouseEvent, type PropsWithChildren, useState } from 'react'

import type { ColorFormat } from '@/types'

import { Button, CopyIcon, FieldForm, NotoEmoji } from '@/components/common'
import { useCopyToClipboard, useDebounceCallback } from '@/hooks'
import { convertColor } from '@/utils/color'

const randomByte = () => {
  return Math.floor(Math.random() * 256)
}

const CopyButton = ({ value }: { value: string }) => {
  const copyToClipboard = useCopyToClipboard()

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

export const ColorConvertor = () => {
  // states
  const [color, setColor] = useState<Record<ColorFormat, string>>(
    convertColor(`rgb(${randomByte()}, ${randomByte()}, ${randomByte()})`, 'rgb'),
  )

  // hooks
  const dbConvertColor = useDebounceCallback((source: Record<ColorFormat, string>, format: ColorFormat) => {
    const value = source[format]
    if (!value.trim()) return

    try {
      const convertedColors = convertColor(value, format)
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
  })

  const handleColorChange = (format: ColorFormat, value: string) => {
    setColor((prev) => ({ ...prev, [format]: value }))
    dbConvertColor({ ...color, [format]: value }, format)
  }

  return (
    <div className="flex size-full max-h-full grow flex-col gap-4 overflow-y-auto">
      <InputWrapper color={color.hex}>
        <FieldForm
          label="Hex"
          name="hex"
          onChange={(val) => handleColorChange('hex', val)}
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
          onChange={(val) => handleColorChange('rgb', val)}
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
          onChange={(val) => handleColorChange('oklch', val)}
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
          onChange={(val) => handleColorChange('hsl', val)}
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
          onChange={(val) => handleColorChange('lab', val)}
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
          onChange={(val) => handleColorChange('lch', val)}
          placeholder="lch(0 0 0)"
          suffix={<CopyButton value={color.lch} />}
          type="text"
          value={color.lch}
        />
      </InputWrapper>
    </div>
  )
}
