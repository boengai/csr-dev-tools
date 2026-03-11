import { Indicator, Item, Root } from '@radix-ui/react-radio-group'

import type { RadioGroupInputProps } from '@/types'

export const RadioGroupInput = ({ disabled, name, onBlur, onChange, options, value }: RadioGroupInputProps) => {
  return (
    <Root
      className="flex flex-wrap items-center gap-4"
      disabled={disabled}
      name={name}
      onBlur={onBlur}
      onValueChange={onChange}
      value={value}
    >
      {options.map((option) => (
        <label className="flex cursor-pointer items-center gap-1.5 text-body-sm text-gray-300" key={option.value}>
          <Item
            className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-700 bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary"
            disabled={option.disabled}
            value={option.value}
          >
            <Indicator className="block size-2 rounded-full bg-primary" />
          </Item>
          {option.label}
        </label>
      ))}
    </Root>
  )
}
