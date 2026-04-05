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
