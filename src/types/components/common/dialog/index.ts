import type { ReactElement, ReactNode } from 'react'

export * from './toolDialogShell'

export type DialogProps = Partial<DialogVariants> & {
  children: ReactNode
  description?: string
  injected?: {
    open: boolean
    setOpen: (value: boolean) => void
  }
  onAfterClose?: () => void
  title: string
  trigger?: ReactElement<HTMLButtonElement>
}

export type DialogVariants = {
  size: 'default' | 'screen' | 'small'
}
