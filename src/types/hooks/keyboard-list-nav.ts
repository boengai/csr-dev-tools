import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react'

export type UseKeyboardListNavOptions<T> = {
  initialIndex?: number
  wraparound?: boolean
  onEnter: (item: T) => void
}

export type UseKeyboardListNavResult<L extends HTMLElement = HTMLUListElement> = {
  activeIndex: number
  setActiveIndex: Dispatch<SetStateAction<number>>
  listRef: RefObject<L | null>
  handleKeyDown: (event: KeyboardEvent) => void
}
