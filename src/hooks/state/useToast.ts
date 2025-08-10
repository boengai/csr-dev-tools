import { create, type StoreApi, type UseBoundStore } from 'zustand'

import { type ToastItemProps, type UseToast } from '@/types'

export const useToast: UseBoundStore<StoreApi<UseToast>> = create<UseToast>()(
  (set: StoreApi<UseToast>['setState']) => ({
    items: [],
    toast: (payload: Parameters<UseToast['toast']>[0]): ReturnType<UseToast['toast']> => {
      switch (payload.action) {
        case 'add': {
          const id: string = `toast-${Date.now()}`.toLowerCase()
          set((prev: UseToast) => ({
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
          set((state: UseToast) => ({
            items: state.items.filter(
              (i: ToastItemProps) => i.id.toLowerCase() !== (payload.itemId as string).toLowerCase(),
            ),
          }))
          return payload.itemId
        }

        case 'update': {
          set((prev: UseToast) => ({
            items: prev.items.map((i: ToastItemProps) =>
              i.id.toLowerCase() === payload.item.id.toLowerCase() ? { ...i, ...payload.item } : i,
            ),
          }))
          return payload.item.id
        }

        default:
          throw new Error('unsupported toast action')
      }
    },
  }),
)
