import { Content, Overlay, Portal, Root } from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ToolRegistryEntry } from '@/types'

import { TOOL_REGISTRY } from '@/constants'
import { useCommandPaletteStore } from '@/hooks'

import { SearchInput } from './SearchInput'

export const CommandPalette = () => {
  const isOpen = useCommandPaletteStore((state) => state.isOpen)
  const close = useCommandPaletteStore((state) => state.close)

  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Capture previously focused element on open
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    close()
    setQuery('')
    setHighlightedIndex(0)
    requestAnimationFrame(() => {
      previouslyFocusedRef.current?.focus()
    })
  }, [close])

  const filteredTools = useMemo(() => {
    if (!query.trim()) return TOOL_REGISTRY
    const normalizedQuery = query.toLowerCase().trim()
    return TOOL_REGISTRY.filter(
      (tool) =>
        tool.name.toLowerCase().includes(normalizedQuery) || tool.category.toLowerCase().includes(normalizedQuery),
    )
  }, [query])

  // Reset highlighted index when query changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  // Auto-scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const highlighted = list.children[highlightedIndex] as HTMLElement | undefined
    highlighted?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const handleSelectTool = useCallback(
    (tool: ToolRegistryEntry) => {
      handleClose()
      requestAnimationFrame(() => {
        const card = document.querySelector(`[data-tool-key="${tool.key}"]`)
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' })
          card.classList.add('command-palette-highlight')
          setTimeout(() => {
            card.classList.remove('command-palette-highlight')
          }, 500)
        }
      })
    },
    [handleClose],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          if (filteredTools.length === 0) break
          setHighlightedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : 0))
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          if (filteredTools.length === 0) break
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredTools.length - 1))
          break
        }
        case 'Enter': {
          event.preventDefault()
          if (filteredTools[highlightedIndex]) {
            handleSelectTool(filteredTools[highlightedIndex])
          }
          break
        }
      }
    },
    [filteredTools, highlightedIndex, handleSelectTool],
  )

  const activeDescendantId = filteredTools[highlightedIndex]
    ? `command-palette-option-${filteredTools[highlightedIndex].key}`
    : undefined

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
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </Overlay>
            <Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                aria-label="Search tools"
                aria-modal="true"
                className="rounded-card fixed top-[20%] left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 flex-col overflow-hidden border border-gray-800 bg-gray-950 shadow-xl"
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                onKeyDown={handleKeyDown}
                role="dialog"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <SearchInput activeDescendantId={activeDescendantId} onChange={setQuery} value={query} />

                <ul
                  aria-label="Search results"
                  className="max-h-72 overflow-y-auto p-2"
                  id="command-palette-results"
                  ref={listRef}
                  role="listbox"
                >
                  {filteredTools.map((tool, index) => (
                    <li
                      aria-selected={index === highlightedIndex}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                        index === highlightedIndex ? 'bg-primary/20 text-white' : 'text-gray-300 hover:bg-gray-900'
                      }`}
                      id={`command-palette-option-${tool.key}`}
                      key={tool.key}
                      onClick={() => handleSelectTool(tool)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      role="option"
                    >
                      <span className="text-lg">{tool.emoji}</span>
                      <span className="grow truncate">{tool.name}</span>
                      <span className="text-body-xs rounded bg-gray-800 px-2 py-0.5 text-gray-400">
                        {tool.category}
                      </span>
                    </li>
                  ))}
                </ul>
                {filteredTools.length === 0 && <p className="px-3 py-6 text-center text-gray-500">No tools found</p>}

                <div className="text-body-xs flex items-center gap-4 border-t border-gray-800 px-4 py-2 text-gray-500">
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
              </motion.div>
            </Content>
          </Portal>
        )}
      </AnimatePresence>
    </Root>
  )
}
