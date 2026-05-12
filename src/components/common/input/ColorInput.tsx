import type { ChangeEvent } from 'react'

import type { ColorInputProps } from '@/types'
import { tv } from '@/utils'

const colorInputStyles = tv({
  base: 'shrink-0 cursor-pointer rounded border border-gray-700 bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-40 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0',
  variants: {
    size: {
      full: 'h-10 w-full',
      swatch: 'h-8 w-12',
    },
  },
  defaultVariants: {
    size: 'swatch',
  },
})

export const ColorInput = ({
  'aria-label': ariaLabel,
  disabled,
  id,
  name,
  onBlur,
  onChange,
  size = 'swatch',
  value,
}: ColorInputProps) => {
  const className = colorInputStyles({ size })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      id={id}
      name={name}
      onBlur={onBlur}
      onChange={handleChange}
      type="color"
      value={value}
    />
  )
}
