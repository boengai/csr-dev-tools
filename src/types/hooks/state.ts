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
  /** Removes the toast with `id`. Wired to Radix `onOpenChange(false)` so items don't accumulate. */
  dismiss: (id: string) => void
  items: Array<ToastItemProps>
  showError: (label: string) => string
  showSuccess: (label: string) => string
}
