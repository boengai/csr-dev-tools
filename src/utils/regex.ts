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

export const MAX_MATCHES = 5000

export const executeRegex = (pattern: string, flags: string, text: string): RegexResult => {
  let regex: RegExp
  try {
    regex = new RegExp(pattern, flags)
  } catch (err) {
    return { capped: false, error: (err as SyntaxError).message, matches: [] }
  }

  const matches: Array<RegexMatch> = []
  let capped = false

  if (flags.includes('g')) {
    const iterator = text.matchAll(regex)
    for (const match of iterator) {
      if (matches.length >= MAX_MATCHES) {
        capped = true
        break
      }
      matches.push({
        fullMatch: match[0],
        groups: match.slice(1) as Array<string | undefined>,
        index: match.index,
        namedGroups: match.groups as Record<string, string> | undefined,
      })
    }
  } else {
    const match = regex.exec(text)
    if (match != null) {
      matches.push({
        fullMatch: match[0],
        groups: match.slice(1) as Array<string | undefined>,
        index: match.index,
        namedGroups: match.groups as Record<string, string> | undefined,
      })
    }
  }

  return { capped, error: null, matches }
}

export const buildHighlightSegments = (text: string, matches: Array<RegexMatch>): Array<HighlightSegment> => {
  if (matches.length === 0) {
    return [{ isMatch: false, text }]
  }

  const segments: Array<HighlightSegment> = []
  let position = 0

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]

    // Skip zero-length matches to avoid infinite loops
    if (match.fullMatch.length === 0) continue

    if (match.index > position) {
      segments.push({ isMatch: false, text: text.slice(position, match.index) })
    }

    segments.push({ isMatch: true, matchIndex: i, text: match.fullMatch })
    position = match.index + match.fullMatch.length
  }

  if (position < text.length) {
    segments.push({ isMatch: false, text: text.slice(position) })
  }

  return segments
}

export const formatMatchesForCopy = (matches: Array<RegexMatch>): string => {
  if (matches.length === 0) return ''

  return matches
    .map((match, i) => {
      const lines = [`Match ${i + 1}: "${match.fullMatch}" at index ${match.index}`]

      for (let g = 0; g < match.groups.length; g++) {
        lines.push(`  Group ${g + 1}: ${match.groups[g] === undefined ? 'undefined' : match.groups[g]}`)
      }

      if (match.namedGroups != null) {
        for (const [name, value] of Object.entries(match.namedGroups)) {
          lines.push(`  ${name}: ${value}`)
        }
      }

      return lines.join('\n')
    })
    .join('\n\n')
}
