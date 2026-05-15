import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { ToggleStore, ToggleStoreOptions } from '@/types'

/**
 * Zustand factory for the "isOpen + open/close/toggle" pattern shared by
 * `useCommandPaletteStore` and `useSidebarStore`. Both stores have an
 * identical interface; the only divergence is whether opening should fire
 * a side effect (CommandPalette captures the previously-focused element
 * before opening so it can restore focus on close).
 *
 * Pass `onOpen` to run a side effect synchronously inside `open()` and
 * inside `toggle()` when transitioning from closed to open. The state
 * update happens AFTER `onOpen` runs so callers can read pre-open state
 * (like `document.activeElement`) before the open dispatch.
 */
export function createToggleStore(
  options: ToggleStoreOptions = {},
): UseBoundStore<StoreApi<ToggleStore>> {
  return create<ToggleStore>()((set) => ({
    close: () => set({ isOpen: false }),
    isOpen: false,
    open: () => {
      options.onOpen?.()
      set({ isOpen: true })
    },
    toggle: () =>
      set((state) => {
        if (!state.isOpen) options.onOpen?.()
        return { isOpen: !state.isOpen }
      }),
  }))
}
