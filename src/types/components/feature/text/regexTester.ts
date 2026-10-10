import type { HighlightSegment, RegexMatch, RegexResult } from '@/types/utils/regex'

export type Flags = { g: boolean; i: boolean; m: boolean }
export type RegexInput = { flags: Flags; pattern: string; testString: string }
export type RegexComputed = { regex: RegexResult | null; segments: Array<HighlightSegment> }
export type RegexFlagToggleProps = { active: boolean; flag: string; onToggle: () => void }
export type RegexMatchDetailsProps = { matches: Array<RegexMatch> }
