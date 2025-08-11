import { motion } from 'motion/react'

import type { CardProps } from '@/types'

export const Card = ({ children, title }: CardProps) => {
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
      <h3 className="text-heading-5 w-full shrink-0 rounded-t-xl bg-gray-800 px-5 py-2">{title}</h3>
      <div className="flex size-full grow flex-col overflow-hidden rounded-b-xl border border-gray-800 bg-white/5 p-6 backdrop-blur">
        {children}
      </div>
    </motion.article>
  )
}
