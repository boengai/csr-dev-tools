export type CronParseResult = {
  description: string
  error: string | null
  nextRuns: Array<string>
  valid: boolean
}

export type CronField = {
  max: number
  min: number
  name: string
  names?: Array<string>
}

export type CronSchedule = {
  daysOfMonth: Array<number>
  daysOfWeek: Array<number>
  hours: Array<number>
  minutes: Array<number>
  months: Array<number>
}
