import type { ChangeEvent, KeyboardEvent } from 'react'

import type { TextAreaInputProps } from '@/types'

export const TextAreaInput = ({
  disabled,
  onChange,
  onEnter,
  placeholder = 'Type here...',
  rows = 4,
  ...props
}: TextAreaInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value

    onChange?.(value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      onEnter?.()
    }
  }

  return (
    <div className="input h-auto flex-col py-2" data-disabled={disabled}>
      <textarea
        {...props}
        autoComplete="off"
        autoCorrect="off"
        className="w-full grow resize-none"
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        spellCheck="false"
      />
    </div>
  )
}
