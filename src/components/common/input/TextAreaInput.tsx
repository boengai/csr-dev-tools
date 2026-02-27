import { type ChangeEvent, type KeyboardEvent, useRef } from 'react'

import type { TextAreaInputProps } from '@/types'

import { inputVariants } from './TextInput'

export const TextAreaInput = ({
  block = true,
  disabled,
  lineNumbers = false,
  onChange,
  onEnter,
  placeholder = 'Type here...',
  rows = 4,
  size = 'default',
  value,
  ...props
}: TextAreaInputProps) => {
  const wrapperClassName = inputVariants({ block, size })
  const gutterRef = useRef<HTMLDivElement>(null)

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      onEnter?.()
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  const lineCount = Math.max((value ?? '').split('\n').length, rows)

  if (lineNumbers) {
    return (
      <div className={`${wrapperClassName} h-auto flex-row items-stretch p-0! text-body-sm`} data-disabled={disabled}>
        <div
          className="shrink-0 border-r border-gray-800 py-2 pr-2 pl-3 font-mono leading-[1.625] text-gray-600 select-none"
          ref={gutterRef}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div className="text-right" key={i}>
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          {...props}
          autoComplete="off"
          autoCorrect="off"
          className="min-h-0 w-full grow resize-none self-stretch py-2 pr-4 pl-3 font-mono leading-[1.625]"
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck="false"
          value={value}
        />
      </div>
    )
  }

  return (
    <div className={`${wrapperClassName} h-auto flex-col py-2`} data-disabled={disabled}>
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
        value={value}
      />
    </div>
  )
}
