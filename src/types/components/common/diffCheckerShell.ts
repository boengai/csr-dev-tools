import type { ReactNode } from 'react'

import type { InlineSpan, SideBySideRow } from '@/types'
import type { ToolComputeContext } from '@/types/hooks/computation'

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
  compute: (input: DiffInput, context: ToolComputeContext) => Promise<R> | R
  description?: string
  errorLabel: string
  initialResult: R
  modifiedPlaceholder: string
  onAfterClose?: () => void
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

export type DiffCellProps = {
  content: string
  lineNum: number | null
  side: 'left' | 'right'
  spans: Array<InlineSpan> | null
  type: SideBySideRow['leftType']
}

export type DiffRowsProps = {
  rows: Array<SideBySideRow>
}
