import type { SideBySideRow } from '@/types'

export type JsonDiffInput = { modified: string; original: string }

export type JsonDiffResult = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
  validationError: string
}
