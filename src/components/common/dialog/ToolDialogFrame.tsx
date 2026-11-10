import { useEffect, useState } from 'react'

import type { ToolDialogFrameProps } from '@/types'

import { Button } from '../button/Button'
import { ToolDialogShell } from './ToolDialogShell'
import { DialogPresentation, useToolPresentation } from './ToolPresentation'

/**
 * Page-level frame for a Tool. On the dashboard (the default `dialog`
 * [[Tool presentation]]) it owns the tile (description + trigger buttons), the
 * dialog open state, and forwards the dialog wiring to [[ToolDialogShell]].
 * On the Tool's own route (`page` presentation, ADR-0029) it skips the tile
 * and renders the Tool inline, registering `onReset` with the page so the
 * page's close control resets the input like closing the dialog does.
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
  const presentation = useToolPresentation()
  const [open, setOpen] = useState(autoOpen ?? false)

  const registerReset = presentation.kind === 'page' ? presentation.registerReset : undefined
  useEffect(() => {
    if (!registerReset) return
    registerReset(onReset)
    return () => registerReset(undefined)
  }, [onReset, registerReset])

  if (presentation.kind === 'page') {
    return (
      <section aria-label={title} className="flex w-full grow flex-col gap-4" data-slot="tool-surface">
        {description && <p className="shrink-0 text-body-xs text-gray-400">{description}</p>}
        <DialogPresentation>{children}</DialogPresentation>
      </section>
    )
  }

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
        onAfterClose={onAfterClose}
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
