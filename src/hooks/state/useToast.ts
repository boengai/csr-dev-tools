import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { ToastItemProps, UseToast } from '@/types'

let toastCounter = 0

const createItem = (item: Omit<ToastItemProps, 'id'>): ToastItemProps => {
  toastCounter += 1
  return { ...item, id: `toast-${toastCounter}` }
}

export const useToast: UseBoundStore<StoreApi<UseToast>> = create<UseToast>()((set) => {
  const push = (item: Omit<ToastItemProps, 'id'>) => {
    const next = createItem(item)
    set((prev) => ({ items: [...prev.items, next] }))
    return next.id
  }

  return {
    dismiss: (id) =>
      set((prev) => {
        const items = prev.items.filter((item) => item.id !== id)
        return items.length === prev.items.length ? prev : { items }
      }),
    items: [],
    showError: (label) => push({ label, type: 'error' }),
    showSuccess: (label) => push({ label, type: 'success' }),
  }
})
