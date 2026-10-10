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

/** Request payload posted to `src/workers/regex.worker.ts` (the bridge adds `id`). */
export type RegexWorkerRequest = { flags: string; pattern: string; text: string }
