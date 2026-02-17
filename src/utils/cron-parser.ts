export type CronParseResult = {
  description: string
  error: string | null
  nextRuns: Array<string>
  valid: boolean
}

type CronField = {
  max: number
  min: number
  name: string
  names?: Array<string>
}

const FIELDS: Array<CronField> = [
  { max: 59, min: 0, name: 'minute' },
  { max: 23, min: 0, name: 'hour' },
  { max: 31, min: 1, name: 'day of month' },
  {
    max: 12,
    min: 1,
    name: 'month',
    names: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  { max: 6, min: 0, name: 'day of week', names: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
]

const parseField = (field: string, meta: CronField): Array<number> | null => {
  const values = new Set<number>()

  for (const part of field.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    let range = stepMatch ? stepMatch[1] : part
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1

    if (step < 1) return null

    let start: number
    let end: number

    if (range === '*') {
      start = meta.min
      end = meta.max
    } else if (range.includes('-')) {
      const [a, b] = range.split('-').map((n) => parseInt(n, 10))
      if (isNaN(a) || isNaN(b) || a < meta.min || b > meta.max || a > b) return null
      start = a
      end = b
    } else {
      const n = parseInt(range, 10)
      if (isNaN(n) || n < meta.min || n > meta.max) return null
      start = n
      end = stepMatch ? meta.max : n
    }

    for (let i = start; i <= end; i += step) {
      values.add(i)
    }
  }

  return [...values].sort((a, b) => a - b)
}

const describeField = (values: Array<number>, meta: CronField): string => {
  if (values.length === meta.max - meta.min + 1) return `every ${meta.name}`
  const labels = meta.names ? values.map((v) => meta.names![v] ?? String(v)) : values.map(String)
  return labels.join(', ')
}

const describeCron = (parsed: Array<Array<number>>): string => {
  const [minutes, hours, doms, months, dows] = parsed
  const parts: Array<string> = []

  // Time
  if (minutes.length === 60 && hours.length === 24) {
    parts.push('Every minute')
  } else if (minutes.length === 60) {
    parts.push(`Every minute during hour ${describeField(hours, FIELDS[1])}`)
  } else if (hours.length === 24) {
    parts.push(`At minute ${describeField(minutes, FIELDS[0])}`)
  } else {
    const timeStr = hours
      .map((h) => minutes.map((m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`))
      .flat()
      .join(', ')
    parts.push(`At ${timeStr}`)
  }

  // Day of month
  if (doms.length < 31) {
    parts.push(`on day ${describeField(doms, FIELDS[2])} of the month`)
  }

  // Month
  if (months.length < 12) {
    parts.push(`in ${describeField(months, FIELDS[3])}`)
  }

  // Day of week
  if (dows.length < 7) {
    parts.push(`on ${describeField(dows, FIELDS[4])}`)
  }

  return parts.join(' ')
}

const getNextRuns = (parsed: Array<Array<number>>, count: number): Array<string> => {
  const [minutes, hours, doms, months, dows] = parsed
  const now = new Date()
  const results: Array<string> = []
  const candidate = new Date(now)
  candidate.setUTCSeconds(0, 0)
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)

  const maxIterations = 525600 // 1 year of minutes
  let iterations = 0

  while (results.length < count && iterations < maxIterations) {
    const m = candidate.getUTCMinutes()
    const h = candidate.getUTCHours()
    const dom = candidate.getUTCDate()
    const mon = candidate.getUTCMonth() + 1
    const dow = candidate.getUTCDay()

    if (minutes.includes(m) && hours.includes(h) && doms.includes(dom) && months.includes(mon) && dows.includes(dow)) {
      results.push(candidate.toISOString().replace('T', ' ').slice(0, 16))
    }

    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)
    iterations++
  }

  return results
}

export const parseCron = (expression: string, nextCount = 5): CronParseResult => {
  const parts = expression.trim().split(/\s+/)

  if (parts.length !== 5) {
    return {
      description: '',
      error: `Expected 5 fields, got ${parts.length}`,
      nextRuns: [],
      valid: false,
    }
  }

  const parsed: Array<Array<number>> = []

  for (let i = 0; i < 5; i++) {
    const values = parseField(parts[i], FIELDS[i])
    if (!values || values.length === 0) {
      return {
        description: '',
        error: `Invalid ${FIELDS[i].name} field: "${parts[i]}"`,
        nextRuns: [],
        valid: false,
      }
    }
    parsed.push(values)
  }

  return {
    description: describeCron(parsed),
    error: null,
    nextRuns: getNextRuns(parsed, nextCount),
    valid: true,
  }
}

export type CronPreset = {
  expression: string
  label: string
}

export const CRON_PRESETS: Array<CronPreset> = [
  { expression: '* * * * *', label: 'Every minute' },
  { expression: '*/5 * * * *', label: 'Every 5 minutes' },
  { expression: '0 * * * *', label: 'Every hour' },
  { expression: '0 0 * * *', label: 'Daily at midnight' },
  { expression: '0 9 * * 1-5', label: 'Weekdays at 9 AM' },
  { expression: '0 0 * * 0', label: 'Weekly on Sunday' },
  { expression: '0 0 1 * *', label: 'Monthly on the 1st' },
  { expression: '30 4 * * *', label: 'Daily at 4:30 AM' },
]
