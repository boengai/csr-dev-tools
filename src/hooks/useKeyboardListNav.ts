import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

import type { UseKeyboardListNavOptions, UseKeyboardListNavResult } from '@/types'

/**
 * Keyboard navigation + auto-scroll for a searchable list rendered as a
 * `<ul>` (or any HTMLElement whose children are the navigable items).
 * Tracks an `activeIndex`, handles ArrowDown/ArrowUp/Enter, and scrolls
 * the active child into view.
 *
 * Per-call-site concerns stay at the call site: the query state and
 * filtering, Escape key behavior, modal vs inline shell, click-outside
 * dismissal, and the item rendering.
 */
export function useKeyboardListNav<T, L extends HTMLElement = HTMLUListElement>(
  items: ReadonlyArray<T>,
  options: UseKeyboardListNavOptions<T>,
): UseKeyboardListNavResult<L> {
  const { getOptionId, initialIndex = 0, onEnter, wraparound = false } = options
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const listRef = useRef<L | null>(null)

  const activeDescendantId =
    getOptionId && activeIndex >= 0 && activeIndex < items.length ? getOptionId(items[activeIndex]) : undefined

  useEffect(() => {
    if (activeIndex < 0) return
    const child = listRef.current?.children[activeIndex] as HTMLElement | undefined
    child?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault()
          if (items.length === 0) break
          setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : wraparound ? 0 : prev))
          break
        }
        case 'ArrowUp': {
          event.preventDefault()
          if (items.length === 0) break
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : wraparound ? items.length - 1 : prev))
          break
        }
        case 'Enter': {
          event.preventDefault()
          if (activeIndex >= 0 && activeIndex < items.length) {
            onEnter(items[activeIndex])
          }
          break
        }
      }
    },
    [activeIndex, items, onEnter, wraparound],
  )

  return { activeDescendantId, activeIndex, handleKeyDown, listRef, setActiveIndex }
}
