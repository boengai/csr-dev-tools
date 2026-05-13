import type { SideBySideRow } from '@/types'

export type State = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

export type Action =
  | { type: 'SET_DIFF_RESULT'; payload: { rows: Array<SideBySideRow>; unifiedDiff: string } }
  | { type: 'RESET' }
