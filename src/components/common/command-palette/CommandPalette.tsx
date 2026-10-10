import { Content, Description, Overlay, Portal, Root, Title } from '@radix-ui/react-dialog'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, m } from 'motion/react'
import { useMemo, useState } from 'react'

import { TOOL_REGISTRY } from '@/constants'
import { useCommandPaletteStore, useKeyboardListNav } from '@/hooks'
import { getPreviouslyFocusedElement } from '@/hooks/state/useCommandPaletteStore'
import type { CommandPaletteBodyProps, ToolRegistryEntry } from '@/types'
import { tv } from '@/utils'

import { SearchInput } from './SearchInput'

const paletteItemStyles = tv({
  base: 'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
  variants: {
    highlighted: {
      true: 'bg-primary/20 text-white',
      false: 'text-gray-300 hover:bg-gray-900',
    },
  },
})

// Mounted only while the palette is open (inside AnimatePresence), so query
// and active-index state reset naturally on close.
const CommandPaletteBody = ({ onSelect }: CommandPaletteBodyProps) => {
  const [query, setQuery] = useState('')

  const filteredTools = useMemo(() => {
    if (!query.trim()) return TOOL_REGISTRY
    const normalizedQuery = query.toLowerCase().trim()
    return TOOL_REGISTRY.filter(
      (tool) =>
        tool.name.toLowerCase().includes(normalizedQuery) || tool.category.toLowerCase().includes(normalizedQuery),
    )
  }, [query])

  const { activeDescendantId, activeIndex, handleKeyDown, listRef, setActiveIndex } =
    useKeyboardListNav<ToolRegistryEntry>(filteredTools, {
      getOptionId: (tool) => `command-palette-option-${tool.key}`,
      initialIndex: 0,
      onEnter: onSelect,
      wraparound: true,
    })

  return (
    <>
      <Title className="sr-only">Search tools</Title>
      <Description className="sr-only">
        Search the catalog of developer tools. Use arrow keys to navigate, Enter to open.
      </Description>
      <SearchInput
        activeDescendantId={activeDescendantId}
        expanded={filteredTools.length > 0}
        onChange={(val) => {
          setQuery(val)
          setActiveIndex(0)
        }}
        onKeyDown={handleKeyDown}
        value={query}
      />

      <ul
        aria-label="Search results"
        className="max-h-72 overflow-y-auto p-2"
        id="command-palette-results"
        ref={listRef}
        role="listbox"
      >
        {filteredTools.map((tool, index) => (
          <li
            aria-selected={index === activeIndex}
            className={paletteItemStyles({ highlighted: index === activeIndex })}
            id={`command-palette-option-${tool.key}`}
            key={tool.key}
            onClick={() => onSelect(tool)}
            onMouseEnter={() => setActiveIndex(index)}
            role="option"
          >
            <span className="text-lg">{tool.emoji}</span>
            <span className="grow truncate">{tool.name}</span>
            <span className="rounded bg-gray-800 px-2 py-0.5 text-body-xs text-gray-400">{tool.category}</span>
          </li>
        ))}
      </ul>
      {filteredTools.length === 0 && <p className="px-3 py-6 text-center text-gray-500">No tools found</p>}

      <div className="flex items-center gap-4 border-t border-gray-800 px-4 py-2 text-body-xs text-gray-500">
        <span>
          <kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">↑↓</kbd> navigate
        </span>
        <span>
          <kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">↵</kbd> select
        </span>
        <span>
          <kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">esc</kbd> close
        </span>
      </div>
    </>
  )
}

export const CommandPalette = () => {
  const isOpen = useCommandPaletteStore((state) => state.isOpen)
  const close = useCommandPaletteStore((state) => state.close)
  const navigate = useNavigate()

  const handleClose = () => {
    close()
    requestAnimationFrame(() => {
      getPreviouslyFocusedElement()?.focus()
    })
  }

  const handleSelectTool = (tool: ToolRegistryEntry) => {
    handleClose()
    navigate({ to: tool.routePath })
  }

  return (
    <Root
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      open={isOpen}
    >
      <AnimatePresence>
        {isOpen && (
          <Portal forceMount>
            <Overlay asChild forceMount>
              <m.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </Overlay>
            {/* Radix autofocuses the first tabbable (the search input) and sets role="dialog"/aria-modal. */}
            <Content asChild forceMount>
              <m.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="fixed top-[20%] left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 flex-col overflow-hidden rounded-card border border-gray-800 bg-gray-950 shadow-xl"
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <CommandPaletteBody onSelect={handleSelectTool} />
              </m.div>
            </Content>
          </Portal>
        )}
      </AnimatePresence>
    </Root>
  )
}
