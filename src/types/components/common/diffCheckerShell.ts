import type { ReactNode } from 'react'

import type { SideBySideRow } from '@/types'

export type DiffInput = { modified: string; original: string }

/**
 * Minimum result shape every diff Tool's `compute` must return. Tools may
 * extend with extra fields (e.g. `validationError`) and surface them via
 * `renderBanner`.
 */
export type DiffOutput = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

export type DiffCheckerShellProps<R extends DiffOutput> = {
  autoOpen?: boolean
  compute: (input: DiffInput) => Promise<R> | R
  description?: string
  errorLabel: string
  initialResult: R
  modifiedPlaceholder: string
  onAfterDialogClose?: () => void
  originalPlaceholder: string
  /**
   * Optional slot rendered between the input columns and the diff output.
   * Tools whose compute can return a validation error (e.g. invalid JSON)
   * use this to surface it; Tools without validation pass nothing.
   */
  renderBanner?: (result: R) => ReactNode
  storageKey: string
  title: string
}
