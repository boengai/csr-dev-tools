import type { ChangeEvent } from 'react'

import type { TextInputProps } from '@/types'

export const TextInput = ({
  disabled,
  onChange,
  placeholder = 'Type here...',
  suffix,
  type,
  ...props
}: TextInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value: string = e.target.value

    if (type === 'number') {
      const numericValue: number = Number(value)
      if (isNaN(numericValue)) {
        return
      }
      onChange(value)
      return
    }

    onChange(value)
  }

  return (
    <div className="input" data-disabled={disabled}>
      <input
        {...props}
        autoComplete="off"
        autoCorrect="off"
        className="w-full grow focus:outline-none"
        disabled={disabled}
        onChange={handleChange}
        placeholder={placeholder}
        spellCheck="false"
        type="text"
      />
      {suffix}
    </div>
  )
}
