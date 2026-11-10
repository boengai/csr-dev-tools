import type { ReactNode } from 'react'

import type { ToolComputeContext } from '@/types/hooks/computation'
import type { SourceFormat } from '@/types/utils/parse-error-narrators'

export type CodecMode<M extends string> = {
  key: M
  label: string
  resultLabel: string
  resultPlaceholder: string
  /**
   * If set, the shell calls the matching parse-error narrator when this
   * mode's `compute` rejects. When the narrator returns a non-null reason,
   * the shell throws `Invalid <FORMAT>: <reason>`; otherwise the original
   * error from `compute` reaches the status slot unchanged. Omit for modes whose
   * source isn't a parseable format (e.g. URL/Base64 encoding).
   */
  sourceFormat?: SourceFormat
  sourceLabel: string
  sourcePlaceholder: string
}

/**
 * Minimum result shape every converter's `compute` must return. Tools may
 * extend with extra fields (e.g. `warnings`) and surface them via
 * `notices`. Mirrors `DiffOutput` in `diffCheckerShell.ts`.
 */
export type CodecOutput = {
  output: string
}

export type CodecShellProps<M extends string, R extends CodecOutput = CodecOutput> = {
  /**
   * Set by the tool route. Also gates the `?mode=<key>` deep link: only an
   * auto-opened Codec reads it, so a Codec opened from the dashboard never
   * picks up an unrelated query string.
   */
  autoOpen?: boolean
  compute: (input: { mode: M; source: string }, context: ToolComputeContext) => Promise<R>
  description?: string
  /**
   * Status-slot text when the rejection is not an `Error` with a message.
   * Defaults to a generic "check your input" line.
   */
  errorFallback?: string
  /**
   * The initial result rendered before the first compute resolves. Required
   * because callers may extend `R` with extra fields (e.g. `warnings`) that
   * the shell cannot synthesize. Mirrors `ComparatorShellProps.initialResult`.
   */
  initialResult: R
  modeStorageKey: string
  /** Non-empty: the first mode is the default when nothing is persisted. */
  modes: CodecModes<M>
  /**
   * Non-fatal messages about a valid result (e.g. skipped lines), shown in
   * the [[Tool status slot]] as notices. Input errors are not notices — let
   * `compute` reject and the shell shows them.
   */
  notices?: (result: R) => Array<string>
  onAfterClose?: () => void
  /**
   * Called whenever the shell clears the source — its reset, which the dialog
   * frame runs when the dialog closes. Tools that keep extra input outside the
   * shell (e.g. a password) clear it here so it follows the same lifecycle.
   */
  onClearInput?: () => void
  /**
   * Persist each mode's source to localStorage (the default). Pass `false`
   * for Tools whose source is sensitive (plaintext, secrets): the source is
   * never written or restored, so it lives only until the dialog closes.
   */
  persistSource?: boolean
  /**
   * Optional prefix prepended to the per-mode source localStorage key:
   * `csr-dev-tools-<prefix>-<mode>-source`. Use when mode names are generic
   * (e.g. 'encode'/'decode') and would otherwise collide with other tools.
   * Omit for tool-unique mode names (e.g. 'json-to-csv').
   */
  sourceKeyPrefix?: string
  /** Per-mode controls rendered in the shell's controls row. */
  sourceToolbarSlot?: (props: { mode: M; recompute: () => void }) => ReactNode
}

/** A non-empty mode list; the first entry is the default when nothing is persisted. */
export type CodecModes<M extends string> = readonly [CodecMode<M>, ...Array<CodecMode<M>>]
