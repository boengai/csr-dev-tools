import { motion } from 'motion/react'

import type { ButtonProps, ButtonVariants, CompVariant } from '@/types'

import { tv } from '@/utils'

const buttonVariants: CompVariant<ButtonVariants> = tv({
  base: 'relative inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  defaultVariants: {
    block: false,
    size: 'default',
    variant: 'default',
  },
  variants: {
    block: {
      false: '',
      true: 'w-full',
    },
    size: {
      default: 'min-h-10 px-4 py-2',
      large: 'min-h-12 px-6 py-3 text-body-lg',
      small: 'min-h-8 px-3 py-1 text-body-sm',
    },
    variant: {
      default: 'border border-primary bg-transparent text-white hover:bg-primary/90 hover:text-white',
      error: 'border border-error bg-transparent text-error hover:bg-error/90 hover:text-white',
      info: 'border border-info bg-transparent text-info hover:bg-info/90 hover:text-white',
      primary: 'border-none bg-primary text-white hover:bg-primary/90',
      secondary: 'border-none bg-secondary text-black hover:bg-secondary/90',
      success: 'border border-success bg-transparent text-success hover:bg-success/90 hover:text-white',
      text: 'bg-transparent p-0! text-white hover:text-primary',
      warning: 'border border-warning bg-transparent text-warning hover:bg-warning/90 hover:text-white',
    },
  },
})

export const Button = ({
  block = false,
  children,
  icon,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) => {
  const className = buttonVariants({ block, size, variant })

  return (
    <motion.button
      {...props}
      className={className}
      initial={{ scale: 1, y: 0 }}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      type={type}
      whileHover={{
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        transition: { duration: 0.2, ease: 'easeOut' },
        y: -2,
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1, ease: 'easeOut' },
        y: 0,
      }}
    >
      <span className="flex items-center justify-center gap-x-2 [&>svg]:shrink-0">
        {icon}
        {children}
      </span>
    </motion.button>
  )
}
