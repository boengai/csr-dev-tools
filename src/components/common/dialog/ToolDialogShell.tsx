import { useState } from 'react'

import type { ToolDialogShellProps } from '@/types'

import { Dialog } from './Dialog'

export const ToolDialogShell = ({
  autoOpen,
  onAfterDialogClose,
  title,
  description,
  size = 'default',
  onReset,
  open,
  onOpenChange,
  children,
}: ToolDialogShellProps) => {
  const [internalOpen, setInternalOpen] = useState(autoOpen ?? false)
  const isControlled = open !== undefined
  const effectiveOpen = isControlled ? (open as boolean) : internalOpen

  const setOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next)
    } else {
      setInternalOpen(next)
    }
  }

  const handleAfterClose = () => {
    onReset?.()
    onAfterDialogClose?.()
  }

  return (
    <Dialog
      injected={{ open: effectiveOpen, setOpen }}
      onAfterClose={handleAfterClose}
      size={size}
      title={title}
      description={description}
    >
      {children}
    </Dialog>
  )
}
