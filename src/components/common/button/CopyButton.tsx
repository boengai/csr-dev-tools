import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { CompVariant, CopyButtonProps, CopyButtonVariants } from '@/types'

import { useCopyToClipboard } from '@/hooks'
import { tv } from '@/utils'

import { CheckIcon, CopyIcon } from '../icon'

export const copyButtonVariants: CompVariant<CopyButtonVariants> = tv({
  base: 'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  defaultVariants: {
    variant: 'icon-only',
  },
  variants: {
    variant: {
      'icon-only': 'text-body-sm h-8 w-8 p-1.5 hover:bg-gray-800',
      labeled: 'text-body-sm gap-1.5 px-3 py-1.5 hover:bg-gray-800',
    },
  },
})

export const CopyButton = ({ label, value, variant = 'icon-only' }: CopyButtonProps) => {
  const copyToClipboard = useCopyToClipboard()
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = useCallback(() => {
    if (!value) return
    copyToClipboard(value)
    setIsCopied(true)
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsCopied(false)
      timeoutRef.current = null
    }, 2000)
  }, [copyToClipboard, value])

  const ariaLabel = label ? `Copy ${label} to clipboard` : 'Copy to clipboard'
  const className = copyButtonVariants({ variant })

  return (
    <button aria-label={ariaLabel} className={className} disabled={!value} onClick={handleCopy} type="button">
      <AnimatePresence initial={false} mode="wait">
        {isCopied ? (
          <motion.span
            key="check"
            animate={{ opacity: 1, scale: 1 }}
            className="text-success inline-flex"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <CheckIcon size={16} />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex"
            exit={{ opacity: 0, scale: 0.8 }}
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <CopyIcon size={16} />
          </motion.span>
        )}
      </AnimatePresence>
      {variant === 'labeled' && <span>Copy</span>}
    </button>
  )
}
