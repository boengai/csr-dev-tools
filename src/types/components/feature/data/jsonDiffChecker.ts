import type { SideBySideRow } from '@/types'

export type JsonDiffCheckerState = {
  dialogOpen: boolean
  error: string
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

export type JsonDiffCheckerAction =
  | { type: 'SET_DIFF_RESULT'; payload: { rows: Array<SideBySideRow>; unifiedDiff: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'RESET' }

export type JsonDiffInput = { modified: string; original: string }

export type JsonDiffResult = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
  validationError: string
}
