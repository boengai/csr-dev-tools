import { describe, expect, it } from 'vitest'

import type { AspectRatioInput } from '@/types'
import { calculateDimension, parseRatio, simplifyRatio, solveAspectRatio } from '@/utils'

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

  describe('solveAspectRatio', () => {
    const base: AspectRatioInput = {
      height: '',
      lastEdited: 'width',
      locked: null,
      ratio: '',
      source: 'width',
      width: '',
    }

    describe('source = "width"', () => {
      it('uses ratio when set: width=1920, ratio=16:9 → height=1080', () => {
        expect(solveAspectRatio({ ...base, ratio: '16:9', source: 'width', width: '1920' })).toEqual({
          height: '1080',
          ratio: '16:9',
          width: '1920',
        })
      })

      it('derives ratio when height is set and ratio is empty', () => {
        expect(solveAspectRatio({ ...base, height: '1080', source: 'width', width: '1920' })).toEqual({
          height: '1080',
          ratio: '16:9',
          width: '1920',
        })
      })

      it('leaves bag unchanged when neither ratio nor height is set', () => {
        expect(solveAspectRatio({ ...base, source: 'width', width: '1920' })).toEqual({
          height: '',
          ratio: '',
          width: '1920',
        })
      })

      it('throws INVALID_WIDTH_MSG when width is not a number', () => {
        expect(() => solveAspectRatio({ ...base, source: 'width', width: 'abc' })).toThrow(/width/i)
      })

      it('throws INVALID_WIDTH_MSG when width is zero', () => {
        expect(() => solveAspectRatio({ ...base, source: 'width', width: '0' })).toThrow(/width/i)
      })

      it('leaves height alone when ratio is set but unparseable', () => {
        expect(solveAspectRatio({ ...base, height: '500', ratio: 'foo', source: 'width', width: '1920' })).toEqual({
          height: '500',
          ratio: 'foo',
          width: '1920',
        })
      })
    })

    describe('source = "height"', () => {
      it('uses ratio when set: height=1080, ratio=16:9 → width=1920', () => {
        expect(solveAspectRatio({ ...base, height: '1080', ratio: '16:9', source: 'height' })).toEqual({
          height: '1080',
          ratio: '16:9',
          width: '1920',
        })
      })

      it('derives ratio when width is set and ratio is empty', () => {
        expect(solveAspectRatio({ ...base, height: '1080', source: 'height', width: '1920' })).toEqual({
          height: '1080',
          ratio: '16:9',
          width: '1920',
        })
      })

      it('throws INVALID_HEIGHT_MSG when height is not a number', () => {
        expect(() => solveAspectRatio({ ...base, height: 'xyz', source: 'height' })).toThrow(/height/i)
      })
    })

    describe('source = "ratio"', () => {
      it('throws INVALID_RATIO_MSG for unparseable ratio', () => {
        expect(() => solveAspectRatio({ ...base, ratio: 'abc:def', source: 'ratio' })).toThrow(/ratio/i)
      })

      it('locked=width: recomputes height, leaves width', () => {
        expect(
          solveAspectRatio({ ...base, locked: 'width', ratio: '4:3', source: 'ratio', width: '1920' }),
        ).toEqual({
          height: '1440',
          ratio: '4:3',
          width: '1920',
        })
      })

      it('locked=height: recomputes width, leaves height', () => {
        expect(
          solveAspectRatio({ ...base, height: '1080', locked: 'height', ratio: '4:3', source: 'ratio' }),
        ).toEqual({
          height: '1080',
          ratio: '4:3',
          width: '1440',
        })
      })

      it('no lock, lastEdited=width with width set: recomputes height', () => {
        expect(
          solveAspectRatio({ ...base, lastEdited: 'width', ratio: '4:3', source: 'ratio', width: '1920' }),
        ).toEqual({
          height: '1440',
          ratio: '4:3',
          width: '1920',
        })
      })

      it('no lock, lastEdited=height with height set: recomputes width', () => {
        expect(
          solveAspectRatio({ ...base, height: '1080', lastEdited: 'height', ratio: '4:3', source: 'ratio' }),
        ).toEqual({
          height: '1080',
          ratio: '4:3',
          width: '1440',
        })
      })

      it('no lock, lastEdited side is empty: leaves both sides alone', () => {
        expect(solveAspectRatio({ ...base, lastEdited: 'width', ratio: '4:3', source: 'ratio' })).toEqual({
          height: '',
          ratio: '4:3',
          width: '',
        })
      })

      it('silently skips recompute when dependent side is invalid (no throw)', () => {
        expect(
          solveAspectRatio({ ...base, lastEdited: 'width', ratio: '4:3', source: 'ratio', width: '0' }),
        ).toEqual({
          height: '',
          ratio: '4:3',
          width: '0',
        })
      })
    })
  })
})
