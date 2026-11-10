import type { InlineSpan, SideBySideRow } from '@/types'
import type { ToolComputeContext } from '@/types/hooks/computation'

export type DiffInput = { modified: string; original: string }

/**
 * Minimum result shape every diff Tool's `compute` must return. Tools may
 * extend with extra fields and surface non-fatal ones via `notices`. Invalid
 * input is not a result field — `compute` rejects and the shell shows it.
 */
export type DiffOutput = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

export type ComparatorShellProps<R extends DiffOutput> = {
  autoOpen?: boolean
  compute: (input: DiffInput, context: ToolComputeContext) => Promise<R> | R
  description?: string
  /** Status-slot text when the rejection is not an `Error` with a message. */
  errorFallback?: string
  /** Status-slot text that always replaces the rejection's own message. */
  errorLabel?: string
  initialResult: R
  modifiedPlaceholder: string
  onAfterClose?: () => void
  /** Non-fatal messages about a valid diff, shown as [[Tool status slot]] notices. */
  notices?: (result: R) => Array<string>
  originalPlaceholder: string
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
