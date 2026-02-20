import { describe, expect, it } from 'vitest'

import { type CrontabConfig, buildCronExpression, describeCron, getNextRuns } from './crontab'

const allEvery: CrontabConfig = {
  minute: { mode: 'every' },
  hour: { mode: 'every' },
  dayOfMonth: { mode: 'every' },
  month: { mode: 'every' },
  dayOfWeek: { mode: 'every' },
}

describe('buildCronExpression', () => {
  it('produces * * * * * for all-wildcard config', () => {
    expect(buildCronExpression(allEvery)).toBe('* * * * *')
  })

  it('produces specific values for minute', () => {
    const config: CrontabConfig = {
      ...allEvery,
      minute: { mode: 'specific', values: [0, 30] },
    }
    expect(buildCronExpression(config)).toBe('0,30 * * * *')
  })

  it('produces range for hour', () => {
    const config: CrontabConfig = {
      ...allEvery,
      hour: { mode: 'range', rangeStart: 9, rangeEnd: 17 },
    }
    expect(buildCronExpression(config)).toBe('* 9-17 * * *')
  })

  it('produces interval for minute', () => {
    const config: CrontabConfig = {
      ...allEvery,
      minute: { mode: 'interval', interval: 5 },
    }
    expect(buildCronExpression(config)).toBe('*/5 * * * *')
  })

  it('does not mutate original values array', () => {
    const values = [30, 0, 15]
    const config: CrontabConfig = {
      ...allEvery,
      minute: { mode: 'specific', values },
    }
    buildCronExpression(config)
    expect(values).toEqual([30, 0, 15])
  })

  it('falls back to * when range start exceeds end', () => {
    const config: CrontabConfig = {
      ...allEvery,
      hour: { mode: 'range', rangeStart: 17, rangeEnd: 9 },
    }
    expect(buildCronExpression(config)).toBe('* * * * *')
  })

  it('handles mixed fields', () => {
    const config: CrontabConfig = {
      minute: { mode: 'specific', values: [0] },
      hour: { mode: 'range', rangeStart: 9, rangeEnd: 17 },
      dayOfMonth: { mode: 'every' },
      month: { mode: 'every' },
      dayOfWeek: { mode: 'specific', values: [1, 2, 3, 4, 5] },
    }
    expect(buildCronExpression(config)).toBe('0 9-17 * * 1,2,3,4,5')
  })
})

describe('describeCron', () => {
  it('returns human-readable string for valid expression', () => {
    const desc = describeCron('*/5 * * * *')
    expect(desc).toBeTruthy()
    expect(desc).toContain('minute')
  })

  it('returns Invalid expression for bad input', () => {
    expect(describeCron('bad')).toBe('Invalid expression')
  })
})

describe('getNextRuns', () => {
  it('returns correct count of future dates', () => {
    const runs = getNextRuns('* * * * *', 5)
    expect(runs).toHaveLength(5)
    for (const run of runs) {
      expect(run).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    }
  })

  it('returns empty array for invalid expression', () => {
    expect(getNextRuns('bad', 5)).toEqual([])
  })
})
