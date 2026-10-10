import type { ToolDialogShellProps } from '@/types'

import { Dialog } from './Dialog'

export const ToolDialogShell = ({
  children,
  description,
  onAfterClose,
  onOpenChange,
  onReset,
  open,
  size = 'default',
  title,
}: ToolDialogShellProps) => {
  const handleAfterClose = () => {
    onReset?.()
    onAfterClose?.()
  }

  return (
    <Dialog
      description={description}
      onAfterClose={handleAfterClose}
      onOpenChange={onOpenChange}
      open={open}
      size={size}
      title={title}
    >
      {children}
    </Dialog>
  )
}
