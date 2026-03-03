import type { ChangeEvent } from 'react'

import type { CheckboxInputProps } from '@/types'

export const CheckboxInput = ({
  'aria-label': ariaLabel,
  checked,
  className,
  disabled,
  id,
  name,
  onBlur,
  onChange,
}: CheckboxInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked)
  }

  return (
    <input
      aria-label={ariaLabel}
      checked={checked}
      className={className}
      disabled={disabled}
      id={id}
      name={name}
      onBlur={onBlur}
      onChange={handleChange}
      type="checkbox"
    />
  )
}
