import type { ChangeEvent } from 'react'

import type { ColorInputProps } from '@/types'

import { tv } from '@/utils'

const colorInputStyles = tv({
  base: 'cursor-pointer rounded border border-gray-700 bg-transparent p-1 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 disabled:cursor-not-allowed disabled:opacity-40',
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

export const ColorInput = ({ className, disabled, name, onBlur, onChange, size = 'swatch', value }: ColorInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  return (
    <input
      className={colorInputStyles({ className, size })}
      disabled={disabled}
      name={name}
      onBlur={onBlur}
      onChange={handleChange}
      type="color"
      value={value}
    />
  )
}
