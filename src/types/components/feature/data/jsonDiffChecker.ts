import type { SideBySideRow } from '@/types'

export type State = {
  dialogOpen: boolean
  error: string
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

export type Action =
  | { type: 'SET_DIFF_RESULT'; payload: { rows: Array<SideBySideRow>; unifiedDiff: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'RESET' }
