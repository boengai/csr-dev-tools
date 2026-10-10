import type { ReactNode } from 'react'

export type ToolDialogSize = 'default' | 'screen' | 'small'

export type ToolDialogShellProps = {
  /** Fires after `onReset`, once the exit animation of a user-initiated close completes. */
  onAfterClose?: () => void

  title: string
  description?: string
  size?: ToolDialogSize

  onReset?: () => void

  open: boolean
  onOpenChange: (open: boolean) => void

  children: ReactNode
}
