import type { ToastItemProps } from '@/types/components'

export type ToggleStore = {
  close: () => void
  isOpen: boolean
  open: () => void
  toggle: () => void
}

export type ToggleStoreOptions = {
  /** Fires synchronously before state flips to open — both via open() and via toggle() when transitioning from closed. Use to capture/seed external state at the moment of opening (e.g. document.activeElement for focus restoration). */
  onOpen?: () => void
}

export type UseToast = {
  items: Array<ToastItemProps>
  showError: (label: string) => string
  showSuccess: (label: string) => string
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
