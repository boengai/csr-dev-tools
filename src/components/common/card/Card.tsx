import { motion } from 'motion/react'

import type { CardProps } from '@/types'

export const Card = ({ children, onClose, title }: CardProps) => {
  return (
    <motion.article
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="rounded-card relative flex size-full grow flex-col overflow-hidden border border-gray-800 bg-gray-950"
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{
        borderColor: 'var(--color-primary)',
        boxShadow: '0 0 12px oklch(0.55 0.22 310 / 0.1)',
        transition: { duration: 0.2, ease: 'easeOut' },
        y: -2,
      }}
    >
      <div className="flex w-full shrink-0 items-center gap-3 border-b border-gray-800 px-4 py-2">
        {onClose ? (
          <motion.button
            className="bg-error size-3 shrink-0 rounded-full"
            onClick={onClose}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            whileHover={{ opacity: 0.8, scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="sr-only">Close</span>
          </motion.button>
        ) : (
          <span className="bg-error size-3 shrink-0 rounded-full" />
        )}
        <h3 className="text-body-sm grow truncate text-gray-400">{title}</h3>
      </div>
      <div className="flex size-full grow flex-col overflow-y-auto p-4">{children}</div>
    </motion.article>
  )
}
