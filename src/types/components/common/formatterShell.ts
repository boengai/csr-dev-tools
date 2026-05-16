import type { ReactNode } from 'react'

/**
 * Render-prop context the shell passes to a Tool's `renderControls`.
 * Tools build their per-Tool top-of-dialog control row (mode/dialect select,
 * indent select, size-savings stat) using this context.
 */
export type FormatterShellControlsCtx<I> = {
  inputs: I
  result: string
  setFieldsImmediate: (partial: Partial<I>) => void
}

export type FormatterShellProps<I extends { source: string }> = {
  autoOpen?: boolean
  compute: (input: I) => Promise<string> | string
  description?: string
  errorLabel: string
  initial: I
  onAfterDialogClose?: () => void
  renderControls?: (ctx: FormatterShellControlsCtx<I>) => ReactNode
  resultPlaceholder: string
  sourceLabel: string
  sourcePlaceholder: string
  storageKey: string
  title: string
  triggerLabel: string
}
