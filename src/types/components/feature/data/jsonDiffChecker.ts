import type { SideBySideRow } from '@/types'

export type JsonDiffResult = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
  validationError: string
}
