import type { ReactNode } from 'react'

import type { SourceFormat } from '@/utils/parse-error-narrators'

export type ConverterMode<M extends string> = {
  key: M
  label: string
  resultLabel: string
  resultPlaceholder: string
  /**
   * If set, the shell calls the matching parse-error narrator when this
   * mode's `compute` rejects. When the narrator returns a non-null reason,
   * the shell throws `Invalid <FORMAT>: <reason>`; otherwise the original
   * error from `compute` flows through to `onError`. Omit for modes whose
   * source isn't a parseable format (e.g. URL/Base64 encoding).
   */
  sourceFormat?: SourceFormat
  sourceLabel: string
  sourcePlaceholder: string
}

/**
 * Minimum result shape every converter's `compute` must return. Tools may
 * extend with extra fields (e.g. `warnings`) and surface them via
 * `renderBanner`. Mirrors `DiffOutput` in `diffCheckerShell.ts`.
 */
export type ConvertOutput = {
  output: string
}

export type BidirectionalConverterProps<M extends string, R extends ConvertOutput = ConvertOutput> = {
  autoOpen?: boolean
  compute: (input: { mode: M; source: string }) => Promise<R>
  description?: string
  /**
   * The initial result rendered before the first compute resolves. Required
   * because callers may extend `R` with extra fields (e.g. `warnings`) that
   * the shell cannot synthesize. Mirrors `DiffCheckerShellProps.initialResult`.
   */
  initialResult: R
  modeStorageKey: string
  modes: ReadonlyArray<ConverterMode<M>>
  onAfterDialogClose?: () => void
  onError?: (error: unknown, mode: M) => void
  /**
   * Optional slot rendered above the source/result `<SplitPanel>`. Tools whose
   * compute can surface inline metadata about the source (warnings, validation
   * notes) render it here instead of routing it through `useToast` — toasts
   * dismiss before the user can act on a source-line reference. Mirrors
   * `DiffCheckerShell.renderBanner`.
   */
  renderBanner?: (result: R) => ReactNode
  /**
   * Optional prefix prepended to the per-mode source localStorage key:
   * `csr-dev-tools-<prefix>-<mode>-source`. Use when mode names are generic
   * (e.g. 'encode'/'decode') and would otherwise collide with other tools.
   * Omit for tool-unique mode names (e.g. 'json-to-csv').
   */
  sourceKeyPrefix?: string
  sourceToolbarSlot?: (props: { mode: M; recompute: () => void }) => ReactNode
}
