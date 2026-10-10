import type { CronField, CronParseResult, CronSchedule } from '@/types/utils/cron-parser'

const MINUTE: CronField = { max: 59, min: 0, name: 'minute' }
const HOUR: CronField = { max: 23, min: 0, name: 'hour' }
const DAY_OF_MONTH: CronField = { max: 31, min: 1, name: 'day of month' }
const MONTH: CronField = {
  max: 12,
  min: 1,
  name: 'month',
  names: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
const DAY_OF_WEEK: CronField = {
  max: 6,
  min: 0,
  name: 'day of week',
  names: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

const FIELDS: ReadonlyArray<CronField> = [MINUTE, HOUR, DAY_OF_MONTH, MONTH, DAY_OF_WEEK]

const parseField = (field: string, meta: CronField): Array<number> | null => {
  const values = new Set<number>()

  for (const part of field.split(',')) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/)
    const range = stepMatch?.[1] ?? part
    const stepText = stepMatch?.[2]
    const step = stepText === undefined ? 1 : parseInt(stepText, 10)

    if (step < 1) return null

    let start: number
    let end: number

    if (range === '*') {
      start = meta.min
      end = meta.max
    } else if (range.includes('-')) {
      const bounds = range.split('-')
      // "1-2-3" used to be accepted as "1-2" with the tail silently dropped.
      if (bounds.length !== 2) return null
      const [a = NaN, b = NaN] = bounds.map((n) => parseInt(n, 10))
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
  const { names } = meta
  const labels = names ? values.map((v) => names[v] ?? String(v)) : values.map(String)
  return labels.join(', ')
}

const describeCron = ({ daysOfMonth, daysOfWeek, hours, minutes, months }: CronSchedule): string => {
  const parts: Array<string> = []

  // Time
  if (minutes.length === 60 && hours.length === 24) {
    parts.push('Every minute')
  } else if (minutes.length === 60) {
    parts.push(`Every minute during hour ${describeField(hours, HOUR)}`)
  } else if (hours.length === 24) {
    parts.push(`At minute ${describeField(minutes, MINUTE)}`)
  } else {
    const timeStr = hours
      .map((h) => minutes.map((m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`))
      .flat()
      .join(', ')
    parts.push(`At ${timeStr}`)
  }

  // Day of month
  if (daysOfMonth.length < 31) {
    parts.push(`on day ${describeField(daysOfMonth, DAY_OF_MONTH)} of the month`)
  }

  // Month
  if (months.length < 12) {
    parts.push(`in ${describeField(months, MONTH)}`)
  }

  // Day of week
  if (daysOfWeek.length < 7) {
    parts.push(`on ${describeField(daysOfWeek, DAY_OF_WEEK)}`)
  }

  return parts.join(' ')
}

const getNextRuns = (schedule: CronSchedule, count: number): Array<string> => {
  const minuteSet = new Set(schedule.minutes)
  const hourSet = new Set(schedule.hours)
  const domSet = new Set(schedule.daysOfMonth)
  const monthSet = new Set(schedule.months)
  const dowSet = new Set(schedule.daysOfWeek)
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

    if (minuteSet.has(m) && hourSet.has(h) && domSet.has(dom) && monthSet.has(mon) && dowSet.has(dow)) {
      results.push(candidate.toISOString().replace('T', ' ').slice(0, 16))
    }

    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)
    iterations++
  }

  return results
}

const invalid = (error: string): CronParseResult => ({ description: '', error, nextRuns: [], valid: false })

export const parseCron = (expression: string, nextCount = 5): CronParseResult => {
  const parts = expression.trim().split(/\s+/)

  if (parts.length !== FIELDS.length) {
    return invalid(`Expected 5 fields, got ${parts.length}`)
  }

  const parsed: Array<Array<number>> = []

  for (const [i, meta] of FIELDS.entries()) {
    const raw = parts[i] ?? ''
    const values = parseField(raw, meta)
    if (!values || values.length === 0) {
      return invalid(`Invalid ${meta.name} field: "${raw}"`)
    }
    parsed.push(values)
  }

  // Every slot is filled: the loop above returns early on any invalid field.
  const [minutes = [], hours = [], daysOfMonth = [], months = [], daysOfWeek = []] = parsed
  const schedule: CronSchedule = { daysOfMonth, daysOfWeek, hours, minutes, months }

  return {
    description: describeCron(schedule),
    error: null,
    nextRuns: getNextRuns(schedule, nextCount),
    valid: true,
  }
}

export const CRON_PRESETS: Array<{
  expression: string
  label: string
}> = [
  { expression: '* * * * *', label: 'Every minute' },
  { expression: '*/5 * * * *', label: 'Every 5 minutes' },
  { expression: '0 * * * *', label: 'Every hour' },
  { expression: '0 0 * * *', label: 'Daily at midnight' },
  { expression: '0 9 * * 1-5', label: 'Weekdays at 9 AM' },
  { expression: '0 0 * * 0', label: 'Weekly on Sunday' },
  { expression: '0 0 1 * *', label: 'Monthly on the 1st' },
  { expression: '30 4 * * *', label: 'Daily at 4:30 AM' },
]

export type { CronParseResult } from '@/types/utils/cron-parser'
