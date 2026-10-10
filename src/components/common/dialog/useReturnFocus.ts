import { useRef } from 'react'

import type { UseReturnFocusResult } from '@/types'

/**
 * Radix Dialog only restores focus to its own `<Trigger>` on close. Dialogs
 * opened through controlled state (a parent `open` prop, a store, a button outside the
 * Root) would drop focus on `<body>`. Call `capture` from `onOpenAutoFocus`
 * (before focus moves in) and pass `handleCloseAutoFocus` as
 * `onCloseAutoFocus` to return focus to whatever opened the dialog.
 */
export const useReturnFocus = (): UseReturnFocusResult => {
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const capture = (container: EventTarget | null) => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement) || active === document.body) return
    if (container instanceof Node && container.contains(active)) return
    returnFocusRef.current = active
  }

  const handleCloseAutoFocus = (event: Event) => {
    const target = returnFocusRef.current
    returnFocusRef.current = null
    // No captured element: fall through to Radix's default (focus the Trigger, if any).
    if (!target?.isConnected) return
    event.preventDefault()
    target.focus({ preventScroll: true })
  }

  return { capture, handleCloseAutoFocus }
}
