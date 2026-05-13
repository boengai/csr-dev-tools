import type { ReactNode } from 'react'

export type ToolDialogSize = 'default' | 'screen' | 'small'

export type ToolDialogShellProps = {
  autoOpen?: boolean
  onAfterDialogClose?: () => void

  title: string
  description?: string
  size?: ToolDialogSize

  onReset?: () => void

  open?: boolean
  onOpenChange?: (open: boolean) => void

  children: ReactNode
}
