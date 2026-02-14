import type { ChangeEvent, KeyboardEvent } from 'react'

import type { TextInputProps } from '@/types'

export const TextInput = ({
  disabled,
  onChange,
  onEnter,
  placeholder = 'Type here...',
  suffix,
  type,
  ...props
}: TextInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (type === 'number') {
      const numericValue = Number(value)
      if (isNaN(numericValue)) {
        return
      }
      onChange?.(value)
      return
    }

    onChange?.(value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onEnter?.()
    }
  }

  return (
    <div className="input" data-disabled={disabled}>
      <input
        {...props}
        autoComplete="off"
        autoCorrect="off"
        className="w-full grow"
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck="false"
        type={type}
      />
      {suffix}
    </div>
  )
}
