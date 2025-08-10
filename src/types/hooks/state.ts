import type { ToastItemProps } from '@/types/components'

export type UseToast = {
  items: Array<ToastItemProps>
  toast: (
    payload:
      | { action: 'add'; item: Omit<ToastItemProps, 'id'> }
      | { action: 'remove'; itemId?: string }
      | { action: 'update'; item: Partial<Omit<ToastItemProps, 'id'>> & Pick<ToastItemProps, 'id'> },
  ) => string
}
