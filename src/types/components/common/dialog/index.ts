import type { ReactElement, ReactNode } from 'react'

export * from './toolDialogFrame'
export * from './toolDialogShell'
export * from './uploadDialogFrame'

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

export type UseReturnFocusResult = {
  /** Record `document.activeElement` (if outside `container`) as the element to refocus on close. */
  capture: (container: EventTarget | null) => void
  /** Pass as Radix `onCloseAutoFocus`. */
  handleCloseAutoFocus: (event: Event) => void
}
