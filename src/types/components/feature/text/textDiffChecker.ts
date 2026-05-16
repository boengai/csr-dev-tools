import type { SideBySideRow } from '@/types'

export type TextDiffInput = { modified: string; original: string }

export type TextDiffResult = { rows: Array<SideBySideRow>; unifiedDiff: string }
