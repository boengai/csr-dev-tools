import type { ChangeEvent, KeyboardEvent } from 'react'

import type { CompVariant, InputVariants, TextInputProps } from '@/types'

import { tv } from '@/utils'

export const inputVariants: CompVariant<InputVariants> = tv({
  base: 'data-[disabled=true]:opacity-50; flex cursor-pointer items-center justify-between gap-2 rounded-sm border border-gray-800 bg-gray-950 text-gray-200 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_2px_oklch(0.55_0.22_310/0.15)] disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-gray-400 data-[disabled=true]:cursor-not-allowed data-[state=open]:border-primary',
  variants: {
    block: {
      true: 'w-full grow',
      false: '',
    },
    size: {
      compact: 'px-2 py-1 text-body-xs',
      default: 'px-4 py-2',
    },
  },
  defaultVariants: {
    block: true,
    size: 'default',
  },
})

export const TextInput = ({
  block = true,
  disabled,
  onChange,
  onEnter,
  placeholder = 'Type here...',
  suffix,
  type,
  size = 'default',
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

  const wrapperClassName = inputVariants({ block, size })

  return (
    <div className={wrapperClassName} data-disabled={disabled}>
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
