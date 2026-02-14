import { describe, expect, it } from 'vitest'

import { getDaysInMonth } from '@/utils/time'

describe('time utilities', () => {
  describe('getDaysInMonth', () => {
    // Standard months
    it('should return 31 for January (month 1)', () => {
      expect(getDaysInMonth(2024, 1)).toBe(31)
    })

    it('should return 28 for February non-leap year (month 2)', () => {
      expect(getDaysInMonth(2023, 2)).toBe(28)
    })

    it('should return 29 for February leap year (month 2)', () => {
      expect(getDaysInMonth(2028, 2)).toBe(29)
    })

    it('should return 31 for March (month 3)', () => {
      expect(getDaysInMonth(2024, 3)).toBe(31)
    })

    it('should return 30 for April (month 4)', () => {
      expect(getDaysInMonth(2024, 4)).toBe(30)
    })

    it('should return 31 for May (month 5)', () => {
      expect(getDaysInMonth(2024, 5)).toBe(31)
    })

    it('should return 30 for June (month 6)', () => {
      expect(getDaysInMonth(2024, 6)).toBe(30)
    })

    it('should return 31 for July (month 7)', () => {
      expect(getDaysInMonth(2024, 7)).toBe(31)
    })

    it('should return 31 for August (month 8)', () => {
      expect(getDaysInMonth(2024, 8)).toBe(31)
    })

    it('should return 30 for September (month 9)', () => {
      expect(getDaysInMonth(2024, 9)).toBe(30)
    })

    it('should return 31 for October (month 10)', () => {
      expect(getDaysInMonth(2024, 10)).toBe(31)
    })

    it('should return 30 for November (month 11)', () => {
      expect(getDaysInMonth(2024, 11)).toBe(30)
    })

    it('should return 31 for December (month 12)', () => {
      expect(getDaysInMonth(2024, 12)).toBe(31)
    })

    // Leap year rules
    it('should return 29 for February 2024 (divisible by 4)', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29)
    })

    it('should return 28 for February 1900 (century, not divisible by 400)', () => {
      expect(getDaysInMonth(1900, 2)).toBe(28)
    })

    it('should return 29 for February 2000 (century, divisible by 400)', () => {
      expect(getDaysInMonth(2000, 2)).toBe(29)
    })

    // Edge cases
    it('should handle month 0 (returns days in December of previous year)', () => {
      expect(getDaysInMonth(2024, 0)).toBe(31)
    })

    it('should handle month 13 (returns days in January of next year)', () => {
      expect(getDaysInMonth(2024, 13)).toBe(31)
    })

    it('should handle year 0 (JS Date maps to 1900, not a leap year)', () => {
      expect(getDaysInMonth(0, 2)).toBe(28)
    })

    it('should handle negative year', () => {
      expect(getDaysInMonth(-1, 1)).toBe(31)
    })
  })
})
