import { describe, expect, it } from 'vitest'

import { calculateDimension, parseRatio, simplifyRatio } from '@/utils/aspect-ratio'

describe('aspect-ratio', () => {
  describe('simplifyRatio', () => {
    it('simplifies 1920x1080 to 16:9', () => {
      expect(simplifyRatio(1920, 1080)).toBe('16:9')
    })

    it('simplifies 800x600 to 4:3', () => {
      expect(simplifyRatio(800, 600)).toBe('4:3')
    })

    it('simplifies 1000x1000 to 1:1', () => {
      expect(simplifyRatio(1000, 1000)).toBe('1:1')
    })

    it('handles prime dimensions like 1921x1081', () => {
      expect(simplifyRatio(1921, 1081)).toBe('1921:1081')
    })

    it('returns empty string for zero width', () => {
      expect(simplifyRatio(0, 1080)).toBe('')
    })

    it('returns empty string for zero height', () => {
      expect(simplifyRatio(1920, 0)).toBe('')
    })

    it('returns empty string for negative width', () => {
      expect(simplifyRatio(-1920, 1080)).toBe('')
    })

    it('returns empty string for negative height', () => {
      expect(simplifyRatio(1920, -1080)).toBe('')
    })

    it('simplifies 2560x1080 to 64:27 (21:9 ultrawide)', () => {
      expect(simplifyRatio(2560, 1080)).toBe('64:27')
    })

    it('rounds non-integer dimensions before simplifying', () => {
      expect(simplifyRatio(1920.4, 1080.2)).toBe('16:9')
    })

    it('returns empty string when height rounds to zero', () => {
      expect(simplifyRatio(100, 0.3)).toBe('')
    })

    it('returns empty string when width rounds to zero', () => {
      expect(simplifyRatio(0.3, 100)).toBe('')
    })
  })

  describe('calculateDimension', () => {
    it('calculates height from known width and 16:9 ratio', () => {
      expect(calculateDimension(1920, 16, 9, 'height')).toBe(1080)
    })

    it('calculates width from known height and 16:9 ratio', () => {
      expect(calculateDimension(1080, 16, 9, 'width')).toBe(1920)
    })

    it('calculates height from known width and 4:3 ratio', () => {
      expect(calculateDimension(800, 4, 3, 'height')).toBe(600)
    })

    it('calculates width from known height and 1:1 ratio', () => {
      expect(calculateDimension(500, 1, 1, 'width')).toBe(500)
    })

    it('returns 0 for zero known value', () => {
      expect(calculateDimension(0, 16, 9, 'height')).toBe(0)
    })

    it('returns 0 for zero ratioW', () => {
      expect(calculateDimension(1920, 0, 9, 'height')).toBe(0)
    })

    it('returns 0 for zero ratioH', () => {
      expect(calculateDimension(1920, 16, 0, 'height')).toBe(0)
    })

    it('returns 0 for negative known value', () => {
      expect(calculateDimension(-1920, 16, 9, 'height')).toBe(0)
    })
  })

  describe('parseRatio', () => {
    it('parses colon format "16:9"', () => {
      expect(parseRatio('16:9')).toEqual({ w: 16, h: 9 })
    })

    it('parses colon format "4:3"', () => {
      expect(parseRatio('4:3')).toEqual({ w: 4, h: 3 })
    })

    it('parses colon format "1:1"', () => {
      expect(parseRatio('1:1')).toEqual({ w: 1, h: 1 })
    })

    it('parses decimal format "1.778" as w:1 ratio', () => {
      expect(parseRatio('1.778')).toEqual({ w: 1.778, h: 1 })
    })

    it('returns null for empty string', () => {
      expect(parseRatio('')).toBeNull()
    })

    it('returns null for whitespace-only string', () => {
      expect(parseRatio('   ')).toBeNull()
    })

    it('returns null for invalid format "abc"', () => {
      expect(parseRatio('abc')).toBeNull()
    })

    it('returns null for zero ratio "0:9"', () => {
      expect(parseRatio('0:9')).toBeNull()
    })

    it('returns null for zero ratio "16:0"', () => {
      expect(parseRatio('16:0')).toBeNull()
    })

    it('returns null for negative ratio "-16:9"', () => {
      expect(parseRatio('-16:9')).toBeNull()
    })

    it('returns null for too many colons "16:9:4"', () => {
      expect(parseRatio('16:9:4')).toBeNull()
    })

    it('trims whitespace before parsing', () => {
      expect(parseRatio('  16:9  ')).toEqual({ w: 16, h: 9 })
    })
  })
})
