import type { SideBySideRow } from '@/types'

export type JsonDiffCheckerState = {
  error: string
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

export type JsonDiffCheckerAction =
  | { type: 'SET_DIFF_RESULT'; payload: { rows: Array<SideBySideRow>; unifiedDiff: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }

export type JsonDiffInput = { modified: string; original: string }

export type JsonDiffResult = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
  validationError: string
}
