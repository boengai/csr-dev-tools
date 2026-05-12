import type { ToggleButtonProps } from '@/types'
import { cnMerge } from '@/utils'

const baseClassName =
  'text-xs rounded border px-3 font-mono leading-7 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500'

export const ToggleButton = ({
  'aria-label': ariaLabel,
  children,
  className = '',
  disabled,
  onClick,
  pressed,
}: ToggleButtonProps) => {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={cnMerge(baseClassName, className)}
      data-state={pressed ? 'active' : 'inactive'}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
