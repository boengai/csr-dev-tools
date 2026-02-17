import { describe, expect, it } from 'vitest'

import { parseCron } from './cron-parser'

describe('parseCron', () => {
  it('parses every minute', () => {
    const result = parseCron('* * * * *')
    expect(result.valid).toBe(true)
    expect(result.description).toContain('Every minute')
    expect(result.nextRuns.length).toBeGreaterThan(0)
  })

  it('parses daily at midnight', () => {
    const result = parseCron('0 0 * * *')
    expect(result.valid).toBe(true)
    expect(result.description).toContain('00:00')
  })

  it('parses weekdays at 9 AM', () => {
    const result = parseCron('0 9 * * 1-5')
    expect(result.valid).toBe(true)
    expect(result.description).toContain('09:00')
    expect(result.description).toContain('Mon')
  })

  it('parses step values', () => {
    const result = parseCron('*/15 * * * *')
    expect(result.valid).toBe(true)
    expect(result.description).toContain('minute')
  })

  it('parses specific months', () => {
    const result = parseCron('0 0 1 1,6 *')
    expect(result.valid).toBe(true)
    expect(result.description).toContain('Jan')
    expect(result.description).toContain('Jun')
  })

  it('returns error for invalid field count', () => {
    const result = parseCron('* * *')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Expected 5 fields')
  })

  it('returns error for invalid minute value', () => {
    const result = parseCron('60 * * * *')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('minute')
  })

  it('returns error for invalid range', () => {
    const result = parseCron('5-2 * * * *')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('minute')
  })

  it('returns requested number of next runs', () => {
    const result = parseCron('* * * * *', 10)
    expect(result.nextRuns).toHaveLength(10)
  })

  it('handles comma-separated values', () => {
    const result = parseCron('0 8,12,18 * * *')
    expect(result.valid).toBe(true)
    expect(result.description).toContain('08:00')
    expect(result.description).toContain('12:00')
    expect(result.description).toContain('18:00')
  })
})
