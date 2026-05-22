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
  /**
   * Pipeline-error toast: always show this exact string on rejection. Mirrors
   * the pipeline option of the same name. Pick this when the underlying
   * library throws implementation-leaking errors (CSS/HTML/SQL/JS WASM
   * facades). Mutually exclusive with `errorFallback`.
   */
  errorLabel?: string
  /**
   * Pipeline-error toast with a generic fallback: shows `err.message` when
   * the rejection is an `Error`, otherwise this fallback string. Pick this
   * when the compute throws user-facing messages (e.g. JSON / YAML routed
   * through [[Parse-error narrator]]) that should reach the user verbatim.
   * Mutually exclusive with `errorLabel`.
   */
  errorFallback?: string
  initial: I
  onAfterDialogClose?: () => void
  renderControls?: (ctx: FormatterShellControlsCtx<I>) => ReactNode
  /**
   * Display label for the result pane (also used as the CopyButton's accessible
   * label). Defaults to `'Result'` — pick a domain-specific label like
   * `'Formatted JSON'` when "Result" reads too generically.
   */
  resultLabel?: string
  resultPlaceholder: string
  sourceLabel: string
  sourcePlaceholder: string
  storageKey: string
  title: string
  triggerLabel: string
}
