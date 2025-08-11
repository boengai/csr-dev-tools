import type { ReactNode } from 'react'

export type ToastItemProps = Partial<ToastItemVariant> & {
  duration?: number
  id: string
  label?: ReactNode
}

export type ToastItemVariant = {
  type: 'error' | 'success'
}
