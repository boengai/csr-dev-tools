export type RegexMatch = {
  fullMatch: string
  groups: Array<string | undefined>
  index: number
  namedGroups: Record<string, string> | undefined
}

export type RegexResult = {
  capped: boolean
  error: string | null
  matches: Array<RegexMatch>
}

export type HighlightSegment = {
  isMatch: boolean
  matchIndex?: number
  text: string
}
