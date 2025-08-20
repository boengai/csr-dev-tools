import { motion } from 'motion/react'

import type { CardProps } from '@/types'

import { XIcon } from '../icon'

export const Card = ({ children, onClose, title }: CardProps) => {
  return (
    <motion.article
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative flex size-full grow flex-col text-white"
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{
        transition: { duration: 0.2, ease: 'easeOut' },
        y: -4,
      }}
    >
      <div className="relative w-full shrink-0 truncate rounded-none rounded-t-xl bg-gray-800 px-5 py-2 pr-14">
        <h3 className="text-heading-5 grow truncate">{title}</h3>
        {onClose && (
          <motion.button
            className="bg-error absolute right-4 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full"
            initial={{ color: 'var(--color-error)', scale: 1 }}
            onClick={onClose}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ color: 'var(--color-white)' }}
            whileTap={{
              scale: 0.98,
              transition: { duration: 0.1, ease: 'easeOut' },
            }}
          >
            <span className="sr-only">Close</span>
            <XIcon size={12} />
          </motion.button>
        )}
      </div>
      <div className="flex size-full grow flex-col overflow-hidden rounded-b-xl border border-gray-800 bg-white/5 p-6 backdrop-blur">
        {children}
      </div>
    </motion.article>
  )
}
