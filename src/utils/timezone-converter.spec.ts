import { describe, expect, it } from 'vitest'

import {
  buildTimezoneIndex,
  convertTimezone,
  getLocalTimezone,
  getTimezoneList,
  parseDateTimeInput,
  parseOffsetToMinutes,
  searchTimezones,
} from '@/utils/timezone-converter'

describe('timezone-converter', () => {
  describe('getTimezoneList', () => {
    it('returns an array of strings', () => {
      const list = getTimezoneList()
      expect(Array.isArray(list)).toBe(true)
      expect(list.length).toBeGreaterThan(0)
      expect(typeof list[0]).toBe('string')
    })

    it('contains well-known timezones', () => {
      const list = getTimezoneList()
      expect(list).toContain('America/New_York')
      expect(list).toContain('Europe/London')
      expect(list).toContain('Asia/Tokyo')
      expect(list).toContain('UTC')
    })

    it('is sorted alphabetically', () => {
      const list = getTimezoneList()
      const sorted = [...list].sort()
      expect(list).toEqual(sorted)
    })
  })

  describe('buildTimezoneIndex', () => {
    it('returns an array of TimezoneEntry objects', () => {
      const index = buildTimezoneIndex()
      expect(Array.isArray(index)).toBe(true)
      expect(index.length).toBeGreaterThan(0)
    })

    it('each entry has all required fields', () => {
      const index = buildTimezoneIndex()
      const entry = index.find((e) => e.id === 'America/New_York')
      expect(entry).toBeDefined()
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('city')
      expect(entry).toHaveProperty('region')
      expect(entry).toHaveProperty('abbreviation')
      expect(entry).toHaveProperty('offset')
      expect(entry).toHaveProperty('offsetMinutes')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('searchTokens')
    })

    it('UTC entry has offsetMinutes 0', () => {
      const index = buildTimezoneIndex()
      const utc = index.find((e) => e.id === 'UTC')
      expect(utc).toBeDefined()
      expect(utc!.offsetMinutes).toBe(0)
    })

    it('America/New_York has city "New York" and region "America"', () => {
      const index = buildTimezoneIndex()
      const ny = index.find((e) => e.id === 'America/New_York')
      expect(ny).toBeDefined()
      expect(ny!.city).toBe('New York')
      expect(ny!.region).toBe('America')
    })
  })

  describe('searchTimezones', () => {
    const index = buildTimezoneIndex()

    it('search "tokyo" returns entries containing Asia/Tokyo', () => {
      const results = searchTimezones('tokyo', index)
      expect(results.some((e) => e.id === 'Asia/Tokyo')).toBe(true)
    })

    it('search "new york" returns America/New_York', () => {
      const results = searchTimezones('new york', index)
      expect(results.some((e) => e.id === 'America/New_York')).toBe(true)
    })

    it('search for timezone abbreviation returns matching entries', () => {
      const results = searchTimezones('gmt+09', index)
      expect(results.length).toBeGreaterThan(0)
      results.forEach((entry) => {
        expect(entry.searchTokens.some((t) => t.includes('gmt+09'))).toBe(true)
      })
    })

    it('empty search returns full index', () => {
      const results = searchTimezones('', index)
      expect(results.length).toBe(index.length)
    })

    it('non-matching search returns empty array', () => {
      const results = searchTimezones('zzzzzznonexistent', index)
      expect(results).toEqual([])
    })
  })

  describe('convertTimezone', () => {
    it('converts a known UTC date to Asia/Tokyo (UTC+9)', () => {
      // Jan 15, 2024 12:00:00 UTC
      const date = new Date(Date.UTC(2024, 0, 15, 12, 0, 0))
      const result = convertTimezone(date, 'UTC', 'Asia/Tokyo')
      expect(result.date).toBe('2024-01-15')
      expect(result.time).toBe('21:00:00')
      // Abbreviation varies by environment: "JST" in browsers, "GMT+9" in Node.js
      expect(['JST', 'GMT+9']).toContain(result.abbreviation)
      expect(result.timezone).toBe('Asia/Tokyo')
    })

    it('result has correct date, time, abbreviation, offset fields', () => {
      const date = new Date(Date.UTC(2024, 6, 15, 12, 0, 0))
      const result = convertTimezone(date, 'UTC', 'America/New_York')
      expect(result).toHaveProperty('date')
      expect(result).toHaveProperty('time')
      expect(result).toHaveProperty('abbreviation')
      expect(result).toHaveProperty('offset')
      expect(result).toHaveProperty('timezone')
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.time).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    })

    it('handles DST — summer vs winter for America/New_York', () => {
      // Winter (EST = UTC-5)
      const winter = new Date(Date.UTC(2024, 0, 15, 17, 0, 0))
      const winterResult = convertTimezone(winter, 'UTC', 'America/New_York')
      expect(winterResult.time).toBe('12:00:00')

      // Summer (EDT = UTC-4)
      const summer = new Date(Date.UTC(2024, 6, 15, 16, 0, 0))
      const summerResult = convertTimezone(summer, 'UTC', 'America/New_York')
      expect(summerResult.time).toBe('12:00:00')
    })
  })

  describe('parseOffsetToMinutes', () => {
    it('"GMT" → 0', () => {
      expect(parseOffsetToMinutes('GMT')).toBe(0)
    })

    it('"GMT+05:30" → 330', () => {
      expect(parseOffsetToMinutes('GMT+05:30')).toBe(330)
    })

    it('"GMT-08:00" → -480', () => {
      expect(parseOffsetToMinutes('GMT-08:00')).toBe(-480)
    })

    it('"GMT+00:00" → 0', () => {
      expect(parseOffsetToMinutes('GMT+00:00')).toBe(0)
    })
  })

  describe('parseDateTimeInput', () => {
    it('parses valid date and time in UTC', () => {
      const result = parseDateTimeInput('2024-01-15', '12:00', 'UTC')
      expect(result).not.toBeNull()
      expect(result!.getUTCFullYear()).toBe(2024)
      expect(result!.getUTCMonth()).toBe(0)
      expect(result!.getUTCDate()).toBe(15)
      expect(result!.getUTCHours()).toBe(12)
      expect(result!.getUTCMinutes()).toBe(0)
    })

    it('parses valid date and time in a non-UTC timezone', () => {
      const result = parseDateTimeInput('2024-01-15', '12:00', 'America/New_York')
      expect(result).not.toBeNull()
      // America/New_York is UTC-5 in January, so 12:00 EST = 17:00 UTC
      expect(result!.getUTCHours()).toBe(17)
    })

    it('returns null for empty date', () => {
      expect(parseDateTimeInput('', '12:00', 'UTC')).toBeNull()
    })

    it('returns null for empty time', () => {
      expect(parseDateTimeInput('2024-01-15', '', 'UTC')).toBeNull()
    })

    it('returns null for malformed date', () => {
      expect(parseDateTimeInput('not-a-date', '12:00', 'UTC')).toBeNull()
    })

    it('returns null for invalid month', () => {
      expect(parseDateTimeInput('2024-13-01', '12:00', 'UTC')).toBeNull()
    })

    it('returns null for invalid hour', () => {
      expect(parseDateTimeInput('2024-01-15', '25:00', 'UTC')).toBeNull()
    })

    it('handles timezone with fractional offset (Asia/Kolkata = UTC+5:30)', () => {
      const result = parseDateTimeInput('2024-01-15', '12:00', 'Asia/Kolkata')
      expect(result).not.toBeNull()
      // 12:00 IST = 06:30 UTC
      expect(result!.getUTCHours()).toBe(6)
      expect(result!.getUTCMinutes()).toBe(30)
    })
  })

  describe('getLocalTimezone', () => {
    it('returns a non-empty string', () => {
      const tz = getLocalTimezone()
      expect(typeof tz).toBe('string')
      expect(tz.length).toBeGreaterThan(0)
    })

    it('returns a valid IANA timezone identifier', () => {
      const tz = getLocalTimezone()
      const allTimezones = getTimezoneList()
      expect(allTimezones).toContain(tz)
    })
  })
})
