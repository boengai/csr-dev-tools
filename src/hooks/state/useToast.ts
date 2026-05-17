import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { ToastItemProps, UseToast } from '@/types'

const appendItem = (item: Omit<ToastItemProps, 'id'>) => {
  const id = `toast-${Date.now()}`.toLowerCase()
  return { id, item: { ...item, id } }
}

export const useToast: UseBoundStore<StoreApi<UseToast>> = create<UseToast>()((set) => ({
  items: [],
  showError: (label) => {
    const { id, item } = appendItem({ label, type: 'error' })
    set((prev) => ({ items: [...prev.items, item] }))
    return id
  },
  showSuccess: (label) => {
    const { id, item } = appendItem({ label, type: 'success' })
    set((prev) => ({ items: [...prev.items, item] }))
    return id
  },
}))
