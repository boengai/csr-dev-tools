import { parseCron } from './cron-parser'
import type { CronFieldConfig, CrontabConfig } from "@/types/utils/crontab";

const buildField = (config: CronFieldConfig): string => {
  switch (config.mode) {
    case 'every':
      return '*'
    case 'specific':
      return config.values && config.values.length > 0 ? [...config.values].sort((a, b) => a - b).join(',') : '*'
    case 'range':
      return config.rangeStart != null && config.rangeEnd != null && config.rangeStart <= config.rangeEnd
        ? `${config.rangeStart}-${config.rangeEnd}`
        : '*'
    case 'interval':
      return config.interval != null && config.interval > 0 ? `*/${config.interval}` : '*'
    default:
      return '*'
  }
}

export function buildCronExpression(config: CrontabConfig): string {
  return [
    buildField(config.minute),
    buildField(config.hour),
    buildField(config.dayOfMonth),
    buildField(config.month),
    buildField(config.dayOfWeek),
  ].join(' ')
}

export function describeCron(expr: string): string {
  const result = parseCron(expr, 0)
  return result.valid ? result.description : 'Invalid expression'
}

export function getNextRuns(expr: string, count: number): Array<string> {
  const result = parseCron(expr, count)
  return result.valid ? result.nextRuns : []
}

export type { CronFieldMode, CronFieldConfig, CrontabConfig } from "@/types/utils/crontab";
