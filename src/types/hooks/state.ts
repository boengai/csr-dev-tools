import type { ToastItemProps } from '@/types/components'

export type UseSidebarStore = {
  close: () => void
  isOpen: boolean
  open: () => void
  toggle: () => void
}

export type UseToast = {
  items: Array<ToastItemProps>
  toast: (
    payload:
      | { action: 'add'; item: Omit<ToastItemProps, 'id'> }
      | { action: 'remove'; itemId?: string }
      | {
          action: 'update'
          item: Partial<Omit<ToastItemProps, 'id'>> & Pick<ToastItemProps, 'id'>
        },
  ) => string
}
