import type { ToggleButtonProps } from '@/types'
import { tv } from '@/utils'

const toggleButtonStyles = tv({
  base: 'rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500',
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
  variants: {
    size: {
      compact: 'min-w-8 px-2',
      default: 'px-3',
    },
    variant: {
      default: 'text-xs font-mono leading-7 data-[state=active]:font-bold',
      subtle: 'py-1 text-body-xs',
    },
  },
})

export const ToggleButton = ({
  'aria-label': ariaLabel,
  children,
  disabled,
  onClick,
  pressed,
  size = 'default',
  variant = 'default',
}: ToggleButtonProps) => {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={toggleButtonStyles({ size, variant })}
      data-state={pressed ? 'active' : 'inactive'}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
