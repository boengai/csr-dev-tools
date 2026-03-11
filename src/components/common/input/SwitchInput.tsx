import { Root, Thumb } from '@radix-ui/react-switch'

import type { SwitchInputProps } from '@/types'

export const SwitchInput = ({
  'aria-label': ariaLabel,
  checked,
  disabled,
  id,
  name,
  onBlur,
  onChange,
}: SwitchInputProps) => {
  return (
    <Root
      aria-label={ariaLabel}
      checked={checked}
      className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border border-gray-700 bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      disabled={disabled}
      id={id}
      name={name}
      onBlur={onBlur}
      onCheckedChange={onChange}
    >
      <Thumb className="block size-5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-5" />
    </Root>
  )
}
