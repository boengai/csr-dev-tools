export type TimezoneEntry = {
  abbreviation: string
  city: string
  id: string
  label: string
  offset: string
  offsetMinutes: number
  region: string
  searchTokens: Array<string>
}

export type ConversionResult = {
  abbreviation: string
  date: string
  offset: string
  time: string
  timezone: string
}

let cachedIndex: Array<TimezoneEntry> | null = null
let cachedRefDate: number | null = null

export function getTimezoneList(): Array<string> {
  const timezones = Intl.supportedValuesOf('timeZone')
  if (!timezones.includes('UTC')) {
    timezones.push('UTC')
  }
  return timezones.sort()
}

export function parseOffsetToMinutes(offset: string): number {
  if (offset === 'GMT' || offset === 'UTC') return 0
  const match = offset.match(/^(?:GMT|UTC)([+-])(\d{2}):(\d{2})$/)
  if (!match) return 0
  const sign = match[1] === '+' ? 1 : -1
  const hours = Number(match[2])
  const minutes = Number(match[3])
  return sign * (hours * 60 + minutes)
}

function getAbbreviation(timezone: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  })
  const parts = formatter.formatToParts(date)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
}

function getOffset(timezone: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  })
  const parts = formatter.formatToParts(date)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
}

function extractCity(timezoneId: string): string {
  const segments = timezoneId.split('/')
  const last = segments[segments.length - 1]
  return last.replace(/_/g, ' ')
}

function extractRegion(timezoneId: string): string {
  return timezoneId.split('/')[0]
}

export function buildTimezoneIndex(referenceDate?: Date): Array<TimezoneEntry> {
  const refDate = referenceDate ?? new Date()
  const refTime = Math.floor(refDate.getTime() / 60_000)

  if (cachedIndex && cachedRefDate === refTime) {
    return cachedIndex
  }

  const timezones = getTimezoneList()
  const entries: Array<TimezoneEntry> = timezones.map((id) => {
    const abbreviation = getAbbreviation(id, refDate)
    const offset = getOffset(id, refDate)
    const offsetMinutes = parseOffsetToMinutes(offset)
    const city = extractCity(id)
    const region = extractRegion(id)
    const label = `${city} (${abbreviation}, ${offset})`

    const searchTokens = [
      ...region.toLowerCase().split('/'),
      ...city.toLowerCase().split(' '),
      abbreviation.toLowerCase(),
      offset.toLowerCase(),
    ]

    return {
      abbreviation,
      city,
      id,
      label,
      offset,
      offsetMinutes,
      region,
      searchTokens,
    }
  })

  entries.sort((a, b) => a.offsetMinutes - b.offsetMinutes)

  cachedIndex = entries
  cachedRefDate = refTime
  return entries
}

export function searchTimezones(query: string, index: Array<TimezoneEntry>): Array<TimezoneEntry> {
  const trimmed = query.toLowerCase().trim()
  if (trimmed.length === 0) return index

  const queryParts = trimmed.split(/\s+/)

  return index.filter((entry) => queryParts.every((part) => entry.searchTokens.some((token) => token.includes(part))))
}

export function convertTimezone(date: Date, _sourceTimezone: string, targetTimezone: string): ConversionResult {
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone: targetTimezone,
    year: 'numeric',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''

  const dateStr = `${get('year')}-${get('month')}-${get('day')}`
  const timeStr = `${get('hour')}:${get('minute')}:${get('second')}`

  const abbreviation = getAbbreviation(targetTimezone, date)
  const offset = getOffset(targetTimezone, date)

  return {
    abbreviation,
    date: dateStr,
    offset,
    time: timeStr,
    timezone: targetTimezone,
  }
}

export function parseDateTimeInput(dateStr: string, timeStr: string, timezone: string): Date | null {
  if (!dateStr || !timeStr) return null

  const dateParts = dateStr.split('-')
  const timeParts = timeStr.split(':')

  if (dateParts.length !== 3 || timeParts.length < 2) return null

  const year = Number(dateParts[0])
  const month = Number(dateParts[1])
  const day = Number(dateParts[2])
  const hour = Number(timeParts[0])
  const minute = Number(timeParts[1])

  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  // Build a guess date in UTC and compute the offset for the source timezone
  const guessUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

  // Get what time it is at guessUtc in the source timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: timezone,
    year: 'numeric',
  })
  const parts = formatter.formatToParts(guessUtc)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0')

  const tzYear = get('year')
  const tzMonth = get('month')
  const tzDay = get('day')
  const tzHour = get('hour')
  const tzMinute = get('minute')

  // Calculate the difference — this is the timezone offset
  const tzTime = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0))
  const diffMs = tzTime.getTime() - guessUtc.getTime()

  // Subtract the offset to get the real UTC time
  const result = new Date(guessUtc.getTime() - diffMs)

  // Verify: the result in the source timezone should match the input
  const verifyParts = formatter.formatToParts(result)
  const vGet = (type: string) => Number(verifyParts.find((p) => p.type === type)?.value ?? '0')
  if (
    vGet('year') !== year ||
    vGet('month') !== month ||
    vGet('day') !== day ||
    vGet('hour') !== hour ||
    vGet('minute') !== minute
  ) {
    // DST edge case: the input time might not exist (spring forward)
    // Return best effort
    return result
  }

  return result
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
