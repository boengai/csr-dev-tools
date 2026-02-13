import { motion } from 'motion/react'
import { useCallback, useId, useState } from 'react'

import type { SidebarCategoryProps } from '@/types'

import { ChevronIcon } from '@/components'

import { CategoryBadge } from './CategoryBadge'

export const SidebarCategory = ({
  categoryName,
  children,
  defaultExpanded = true,
  toolCount,
}: SidebarCategoryProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const listId = useId()

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  return (
    <div className="flex flex-col">
      <button
        aria-controls={listId}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-gray-400 transition-colors hover:text-white"
        onClick={handleToggle}
        type="button"
      >
        <motion.span
          animate={{ rotate: isExpanded ? 0 : -90 }}
          className="flex shrink-0 items-center"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ChevronIcon />
        </motion.span>
        <span className="text-body-sm grow text-left font-medium">{categoryName}</span>
        <CategoryBadge count={toolCount} />
      </button>

      <motion.ul
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        className="flex flex-col overflow-hidden pl-2"
        id={listId}
        initial={false}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.ul>
    </div>
  )
}
