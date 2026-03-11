import { Indicator, Root } from '@radix-ui/react-checkbox'

import type { CheckboxInputProps } from '@/types'

export const CheckboxInput = ({
  'aria-label': ariaLabel,
  checked,
  disabled,
  id,
  name,
  onBlur,
  onChange,
}: CheckboxInputProps) => {
  return (
    <Root
      aria-label={ariaLabel}
      checked={checked}
      className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-gray-700 bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      disabled={disabled}
      id={id}
      name={name}
      onBlur={onBlur}
      onCheckedChange={onChange}
    >
      <Indicator className="flex items-center justify-center text-white">
        <svg fill="none" height="10" viewBox="0 0 12 10" width="10" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1 5L4.5 8.5L11 1.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </Indicator>
    </Root>
  )
}
