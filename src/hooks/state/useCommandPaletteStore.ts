import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { UseCommandPaletteStore } from '@/types'

export const useCommandPaletteStore: UseBoundStore<StoreApi<UseCommandPaletteStore>> = create<UseCommandPaletteStore>()(
  (set: StoreApi<UseCommandPaletteStore>['setState']) => ({
    close: () => set({ isOpen: false }),
    isOpen: false,
    open: () => set({ isOpen: true }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }),
)
