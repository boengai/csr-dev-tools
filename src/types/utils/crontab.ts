export type CronFieldMode = 'every' | 'interval' | 'range' | 'specific'

export type CronFieldConfig = {
  interval?: number
  mode: CronFieldMode
  rangeEnd?: number
  rangeStart?: number
  values?: Array<number>
}

export type CrontabConfig = {
  dayOfMonth: CronFieldConfig
  dayOfWeek: CronFieldConfig
  hour: CronFieldConfig
  minute: CronFieldConfig
  month: CronFieldConfig
}
