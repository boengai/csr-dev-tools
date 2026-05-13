import type { ReactNode } from 'react'

export type ConverterMode<M extends string> = {
  key: M
  label: string
  resultLabel: string
  resultPlaceholder: string
  sourceLabel: string
  sourcePlaceholder: string
}

export type BidirectionalConverterProps<M extends string> = {
  autoOpen?: boolean
  compute: (input: { mode: M; source: string }) => Promise<string>
  description?: string
  modeStorageKey: string
  modes: [ConverterMode<M>, ConverterMode<M>]
  onAfterDialogClose?: () => void
  onError?: (error: unknown, mode: M) => void
  /**
   * Optional prefix prepended to the per-mode source localStorage key:
   * `csr-dev-tools-<prefix>-<mode>-source`. Use when mode names are generic
   * (e.g. 'encode'/'decode') and would otherwise collide with other tools.
   * Omit for tool-unique mode names (e.g. 'json-to-csv').
   */
  sourceKeyPrefix?: string
  sourceToolbarSlot?: (props: { mode: M; recompute: () => void }) => ReactNode
}
