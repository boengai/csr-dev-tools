import { m } from 'motion/react'

import type { CardProps } from '@/types'

const TILE_HOVER = {
  transition: { duration: 0.2, ease: 'easeOut' as const },
  y: -2,
}

export const Card = ({ children, onClose, title, variant = 'tile' }: CardProps) => {
  const isPage = variant === 'page'
  const Heading = isPage ? 'h1' : 'h3'

  return (
    <m.article
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={
        isPage
          ? 'relative flex size-full grow flex-col overflow-hidden rounded-card border border-gray-800 bg-gray-900'
          : 'relative flex size-full grow flex-col overflow-hidden rounded-card border border-gray-800 bg-gray-900 transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary hover:shadow-[0_0_12px_oklch(0.55_0.22_310/0.1)]'
      }
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={isPage ? undefined : TILE_HOVER}
    >
      <div className="flex w-full shrink-0 items-center gap-3 border-b border-gray-800 px-4 py-2">
        {onClose && (
          <m.button
            className="relative size-3 shrink-0 rounded-full bg-error before:absolute before:inset-[-12px] before:content-['']"
            onClick={onClose}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            whileHover={{ opacity: 0.8, scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="sr-only">Close</span>
          </m.button>
        )}
        <Heading className="grow truncate text-body-sm text-gray-400">{title}</Heading>
      </div>
      <div className="flex size-full grow flex-col overflow-y-auto p-4">{children}</div>
    </m.article>
  )
}
