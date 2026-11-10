import { useKeyboardShortcut } from '@/hooks'
import type { ModEnterActionProps } from '@/types'
import { MOD_KEY_LABEL } from '@/utils'

const isModEnter = (event: KeyboardEvent) => (event.metaKey || event.ctrlKey) && event.key === 'Enter'

/**
 * Wraps a layout shell's primary action (Generate, Process): ⌘/Ctrl+Enter
 * triggers it while this is mounted, and the key hint sits beside it. Mount it
 * inside the dialog body so the shortcut listens only while the dialog is open.
 */
export const ModEnterAction = ({ children, disabled = false, onTrigger }: ModEnterActionProps) => {
  useKeyboardShortcut(isModEnter, (event) => {
    event.preventDefault()
    if (!disabled) onTrigger()
  })

  return (
    <div className="flex items-center gap-3">
      <div className="grow">{children}</div>
      <kbd className="shrink-0 font-mono text-body-xs text-gray-500">{`${MOD_KEY_LABEL}↵`}</kbd>
    </div>
  )
}
