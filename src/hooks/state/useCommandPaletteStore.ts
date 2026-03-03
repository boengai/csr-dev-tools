import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { UseCommandPaletteStore } from '@/types'

let _previouslyFocused: HTMLElement | null = null

export const getPreviouslyFocusedElement = () => _previouslyFocused

export const useCommandPaletteStore: UseBoundStore<StoreApi<UseCommandPaletteStore>> = create<UseCommandPaletteStore>()(
  (set: StoreApi<UseCommandPaletteStore>['setState']) => ({
    close: () => set({ isOpen: false }),
    isOpen: false,
    open: () => {
      _previouslyFocused = document.activeElement as HTMLElement
      set({ isOpen: true })
    },
    toggle: () =>
      set((state) => {
        if (!state.isOpen) {
          _previouslyFocused = document.activeElement as HTMLElement
        }
        return { isOpen: !state.isOpen }
      }),
  }),
)
