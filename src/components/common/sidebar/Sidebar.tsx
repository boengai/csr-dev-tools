import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ToolCategory, ToolRegistryEntry } from '@/types'

import { XIcon } from '@/components'
import { TOOL_REGISTRY } from '@/constants'
import { useSidebarStore } from '@/hooks'

import { SidebarCategory } from './SidebarCategory'
import { SidebarToolItem } from './SidebarToolItem'

const CATEGORY_ORDER: Array<ToolCategory> = ['Color', 'Encoding', 'Image', 'Time', 'Unit']

export const Sidebar = () => {
  const close = useSidebarStore((state) => state.close)
  const isOpen = useSidebarStore((state) => state.isOpen)
  const sidebarRef = useRef<HTMLElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close, isOpen])

  // Focus trap for mobile overlay
  useEffect(() => {
    if (!isOpen || !isMobile) return
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const getFocusable = () =>
      sidebar.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')

    const elements = getFocusable()
    if (elements.length > 0) elements[0].focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isMobile, isOpen])

  // Group tools by category
  const groupedTools = useMemo(() => {
    return TOOL_REGISTRY.reduce<Record<string, Array<ToolRegistryEntry>>>((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = []
      }
      acc[tool.category].push(tool)
      return acc
    }, {})
  }, [])

  const handleBackdropClick = useCallback(() => {
    close()
  }, [close])

  const navContent = (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-heading-6 text-white">Tools</span>
        <button
          aria-label="Close navigation"
          className="flex size-8 items-center justify-center rounded text-gray-400 transition-colors hover:text-white"
          onClick={close}
          type="button"
        >
          <XIcon />
        </button>
      </div>
      <div className="flex grow flex-col overflow-y-auto px-2 pb-4">
        {CATEGORY_ORDER.filter((cat) => groupedTools[cat]).map((category) => (
          <SidebarCategory categoryName={category} key={category} toolCount={groupedTools[category].length}>
            {groupedTools[category].map((tool) => (
              <li key={tool.key}>
                <SidebarToolItem emoji={tool.emoji} name={tool.name} toolKey={tool.key} />
              </li>
            ))}
          </SidebarCategory>
        ))}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={handleBackdropClick}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.nav
            animate={{ x: 0 }}
            aria-label="Tool navigation"
            aria-modal="true"
            className="fixed inset-y-0 left-0 z-50 flex w-full flex-col bg-gray-950 pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)]"
            exit={{ x: '-100%' }}
            initial={{ x: '-100%' }}
            ref={sidebarRef}
            role="dialog"
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {navContent}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <AnimatePresence>
        {isOpen && !isMobile && (
          <motion.nav
            animate={{ width: 260, x: 0 }}
            aria-label="Tool navigation"
            className="z-30 flex shrink-0 flex-col overflow-hidden border-r border-gray-800 bg-gray-950"
            exit={{ width: 0, x: -260 }}
            initial={{ width: 0, x: -260 }}
            ref={sidebarRef}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex h-full w-[260px] flex-col">{navContent}</div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
