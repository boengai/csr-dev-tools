import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { UseToast } from '@/types'

export const useToast: UseBoundStore<StoreApi<UseToast>> = create<UseToast>()((set) => ({
  items: [],
  toast: (payload) => {
    switch (payload.action) {
      case 'add': {
        const id = `toast-${Date.now()}`.toLowerCase()
        set((prev) => ({
          items: [...prev.items, { ...payload.item, id }],
        }))
        return id
      }

      case 'remove': {
        // when given undefined itemId
        // will clear all items' data
        if (!payload.itemId) {
          set(() => ({ items: [] }))
          return ''
        }
        set((state) => ({
          items: state.items.filter((i) => i.id.toLowerCase() !== (payload.itemId as string).toLowerCase()),
        }))
        return payload.itemId
      }

      case 'update': {
        set((prev) => ({
          items: prev.items.map((i) =>
            i.id.toLowerCase() === payload.item.id.toLowerCase() ? { ...i, ...payload.item } : i,
          ),
        }))
        return payload.item.id
      }

      default:
        throw new Error('unsupported toast action')
    }
  },
}))
