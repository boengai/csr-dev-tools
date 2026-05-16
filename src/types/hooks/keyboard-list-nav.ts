import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react'

export type UseKeyboardListNavOptions<T> = {
  initialIndex?: number
  wraparound?: boolean
  onEnter: (item: T) => void
  /**
   * Derives the DOM `id` for a list item. When provided, the hook returns
   * `activeDescendantId` so adopters can wire `aria-activedescendant` on the
   * search input — required for screen readers to announce the highlighted
   * item during ArrowDown/Up navigation in a combobox pattern.
   */
  getOptionId?: (item: T) => string
}

export type UseKeyboardListNavResult<L extends HTMLElement = HTMLUListElement> = {
  activeIndex: number
  setActiveIndex: Dispatch<SetStateAction<number>>
  listRef: RefObject<L | null>
  handleKeyDown: (event: KeyboardEvent) => void
  /** Defined when `getOptionId` is provided and an item is currently active. */
  activeDescendantId: string | undefined
}
