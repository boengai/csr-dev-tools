import { useState } from 'react'

import { Button } from '@/components/common/button/Button'
import type { ToolDialogFrameProps } from '@/types'
import { ToolDialogShell } from './ToolDialogShell'

/**
 * Page-level frame for a Tool whose interior lives in a dialog. Owns the
 * tile (description + trigger buttons), the dialog open state, and forwards
 * the dialog wiring to [[ToolDialogShell]].
 *
 * Replaces the four-concern boilerplate every dialog Tool used to repeat:
 * `useState(dialogOpen)`, the centered trigger area, the trigger button(s),
 * and `<ToolDialogShell open=.../onOpenChange=.../onAfterDialogClose=.../>`.
 *
 * Triggers' `onOpen` fires synchronously in the same React event that flips
 * the dialog open, so any state set there is committed before the body renders.
 */
export const ToolDialogFrame = ({
  autoOpen,
  children,
  description,
  onAfterClose,
  onReset,
  size = 'screen',
  title,
  triggers,
}: ToolDialogFrameProps) => {
  const [open, setOpen] = useState(autoOpen ?? false)

  const handleTrigger = (onTriggerOpen?: () => void) => () => {
    onTriggerOpen?.()
    setOpen(true)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {description && <p className="shrink-0 text-body-xs text-gray-400">{description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          {triggers.map((trigger) => (
            <Button block key={trigger.label} onClick={handleTrigger(trigger.onOpen)} variant="default">
              {trigger.label}
            </Button>
          ))}
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterClose}
        onOpenChange={setOpen}
        onReset={onReset}
        open={open}
        size={size}
        title={title}
      >
        {children}
      </ToolDialogShell>
    </>
  )
}
