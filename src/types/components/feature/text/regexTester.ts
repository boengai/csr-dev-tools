import type { HighlightSegment, RegexResult } from '@/utils'

export type Flags = { g: boolean; i: boolean; m: boolean }

export type State = {
  flags: Flags
  pattern: string
  result: RegexResult | null
  segments: Array<HighlightSegment>
  testString: string
}

export type Action =
  | { type: 'SET_PATTERN'; payload: string }
  | { type: 'SET_TEST_STRING'; payload: string }
  | { type: 'SET_FLAGS'; payload: Flags }
  | { type: 'SET_RESULT'; payload: { result: RegexResult | null; segments: Array<HighlightSegment> } }
  | { type: 'RESET' }
