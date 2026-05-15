import { createToggleStore } from './createToggleStore'

let _previouslyFocused: HTMLElement | null = null

export const getPreviouslyFocusedElement = () => _previouslyFocused

export const useCommandPaletteStore = createToggleStore({
  onOpen: () => {
    _previouslyFocused = document.activeElement as HTMLElement
  },
})
