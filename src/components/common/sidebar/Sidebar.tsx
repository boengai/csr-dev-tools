import { useLocation } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CATEGORY_ORDER, groupToolsByCategory, TOOL_REGISTRY } from '@/constants'
import { useSidebarStore } from '@/hooks'

import { SidebarCategory } from './SidebarCategory'
import { SidebarToolItem } from './SidebarToolItem'

export const Sidebar = () => {
  const close = useSidebarStore((state) => state.close)
  const isOpen = useSidebarStore((state) => state.isOpen)
  const { pathname } = useLocation()
  const sidebarRef = useRef<HTMLElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport (for width class toggle only)
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

  // Focus trap for overlay (all viewports)
  useEffect(() => {
    if (!isOpen) return
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
  }, [isOpen])

  // Group tools by category
  const groupedTools = useMemo(() => groupToolsByCategory(TOOL_REGISTRY), [])

  const navContent = (
    <div className="flex grow flex-col overflow-y-auto pt-8 pb-4">
      {CATEGORY_ORDER.filter((cat) => groupedTools[cat]).map((category) => (
        <SidebarCategory categoryName={category} key={category}>
          {groupedTools[category].map((tool) => (
            <li key={tool.key}>
              <SidebarToolItem
                emoji={tool.emoji}
                isActive={pathname === tool.routePath}
                name={tool.name}
                toolKey={tool.key}
              />
            </li>
          ))}
        </SidebarCategory>
      ))}
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={close}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            animate={{ x: 0 }}
            aria-label="Tool navigation"
            className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-800 bg-gray-950 pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)] ${isMobile ? 'w-full' : 'w-[260px]'}`}
            exit={{ x: '-100%' }}
            initial={{ x: '-100%' }}
            ref={sidebarRef}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {navContent}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}
