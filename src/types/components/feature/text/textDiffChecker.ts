import type { SideBySideRow } from '@/types'

export type TextDiffState = {
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

export type TextDiffAction =
  | { type: 'SET_DIFF_RESULT'; payload: { rows: Array<SideBySideRow>; unifiedDiff: string } }
  | { type: 'RESET' }

export type TextDiffInput = { modified: string; original: string }

export type TextDiffResult = { rows: Array<SideBySideRow>; unifiedDiff: string }
