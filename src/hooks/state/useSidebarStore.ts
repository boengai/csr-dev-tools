import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { UseSidebarStore } from '@/types'

export const useSidebarStore: UseBoundStore<StoreApi<UseSidebarStore>> = create<UseSidebarStore>()(
  (set: StoreApi<UseSidebarStore>['setState']) => ({
    close: () => set({ isOpen: false }),
    isOpen: false,
    open: () => set({ isOpen: true }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }),
)
