import { Close, Content, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog'
import { AnimatePresence, m } from 'motion/react'

import { CATEGORY_ORDER, groupToolsByCategory, TOOL_REGISTRY } from '@/constants'
import { useMediaQuery, useSidebarStore } from '@/hooks'
import { tv } from '@/utils'

import { useReturnFocus } from '../dialog/useReturnFocus'
import { XIcon } from '../icon'
import { SidebarCategory } from './SidebarCategory'
import { SidebarHomeItem } from './SidebarHomeItem'
import { SidebarToolItem } from './SidebarToolItem'

const sidebarNavStyles = tv({
  base: 'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-800 bg-gray-950 pt-(--safe-area-inset-top) pb-(--safe-area-inset-bottom) outline-none',
  variants: {
    mobile: {
      true: 'w-full',
      false: 'w-[260px]',
    },
  },
})

// TOOL_REGISTRY is static, so grouping happens once at module load.
const GROUPED_TOOLS = groupToolsByCategory(TOOL_REGISTRY)
const VISIBLE_CATEGORIES = CATEGORY_ORDER.flatMap((category) => {
  const tools = GROUPED_TOOLS[category]
  return tools ? [{ category, tools }] : []
})

/**
 * Modal navigation drawer built on Radix Dialog (like CommandPalette): Radix
 * owns the focus trap, Escape handling (layer-aware, so Escape inside the
 * CommandPalette doesn't also close this), outside-click dismissal and
 * `aria-hidden` on the rest of the page. Focus restore is explicit via
 * useReturnFocus since the hamburger isn't a Radix Trigger.
 */
export const Sidebar = () => {
  const close = useSidebarStore((state) => state.close)
  const isOpen = useSidebarStore((state) => state.isOpen)
  const isMobile = useMediaQuery('(max-width: 767px)')
  // The hamburger lives outside the Root (no Radix Trigger), so restore focus explicitly.
  const { capture, handleCloseAutoFocus } = useReturnFocus()

  return (
    <Root
      onOpenChange={(open) => {
        if (!open) close()
      }}
      open={isOpen}
    >
      <AnimatePresence>
        {isOpen && (
          <Portal forceMount>
            <Overlay asChild forceMount>
              <m.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </Overlay>
            <Content
              aria-describedby={undefined}
              asChild
              forceMount
              onCloseAutoFocus={handleCloseAutoFocus}
              onOpenAutoFocus={(event) => capture(event.currentTarget)}
            >
              <m.nav
                animate={{ x: 0 }}
                aria-label="Tool navigation"
                className={sidebarNavStyles({ mobile: isMobile })}
                exit={{ x: '-100%' }}
                initial={{ x: '-100%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Title className="sr-only">Tool navigation</Title>
                <div className="flex grow flex-col overflow-y-auto pb-4">
                  <div className="flex items-center justify-end px-2 pt-2">
                    <Close
                      aria-label="Close navigation"
                      className="flex size-10 items-center justify-center rounded text-gray-400 transition-colors hover:text-white"
                    >
                      <XIcon size={20} />
                    </Close>
                  </div>
                  <div className="mb-2 px-1">
                    <SidebarHomeItem />
                  </div>
                  {VISIBLE_CATEGORIES.map(({ category, tools }) => (
                    <SidebarCategory categoryName={category} key={category}>
                      {tools.map((tool) => (
                        <li key={tool.key}>
                          <SidebarToolItem emoji={tool.emoji} name={tool.name} routePath={tool.routePath} />
                        </li>
                      ))}
                    </SidebarCategory>
                  ))}
                </div>
              </m.nav>
            </Content>
          </Portal>
        )}
      </AnimatePresence>
    </Root>
  )
}
