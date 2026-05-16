import { describe, expect, it } from 'vitest'

import { pxToRem, remToPx, solvePxRem } from '@/utils'

describe('unit utilities', () => {
  describe('pxToRem', () => {
    // Standard conversions (base 16)
    it('should convert 16px to 1rem with base 16', () => {
      expect(pxToRem(16, 16)).toBe(1)
    })
    it('should convert 32px to 2rem with base 16', () => {
      expect(pxToRem(32, 16)).toBe(2)
    })
    it('should convert 8px to 0.5rem with base 16', () => {
      expect(pxToRem(8, 16)).toBe(0.5)
    })

    // Custom base sizes
    it('should convert 20px to 1rem with base 20', () => {
      expect(pxToRem(20, 20)).toBe(1)
    })
    it('should convert 10px to 1rem with base 10', () => {
      expect(pxToRem(10, 10)).toBe(1)
    })

    // Decimal values
    it('should convert 12.5px to 0.78125rem with base 16', () => {
      expect(pxToRem(12.5, 16)).toBe(0.78125)
    })
    it('should convert 1px to 0.0625rem with base 16', () => {
      expect(pxToRem(1, 16)).toBe(0.0625)
    })

    // Zero
    it('should convert 0px to 0rem', () => {
      expect(pxToRem(0, 16)).toBe(0)
    })

    // Negative values
    it('should convert -16px to -1rem with base 16', () => {
      expect(pxToRem(-16, 16)).toBe(-1)
    })

    // Large values
    it('should convert 1000px to 62.5rem with base 16', () => {
      expect(pxToRem(1000, 16)).toBe(62.5)
    })
  })

  describe('remToPx', () => {
    // Standard conversions (base 16)
    it('should convert 1rem to 16px with base 16', () => {
      expect(remToPx(1, 16)).toBe(16)
    })
    it('should convert 2rem to 32px with base 16', () => {
      expect(remToPx(2, 16)).toBe(32)
    })
    it('should convert 0.5rem to 8px with base 16', () => {
      expect(remToPx(0.5, 16)).toBe(8)
    })

    // Custom base sizes
    it('should convert 1rem to 20px with base 20', () => {
      expect(remToPx(1, 20)).toBe(20)
    })
    it('should convert 1rem to 10px with base 10', () => {
      expect(remToPx(1, 10)).toBe(10)
    })

    // Decimal values
    it('should convert 0.75rem to 12px with base 16', () => {
      expect(remToPx(0.75, 16)).toBe(12)
    })
    it('should convert 1.5rem to 24px with base 16', () => {
      expect(remToPx(1.5, 16)).toBe(24)
    })

    // Zero
    it('should convert 0rem to 0px', () => {
      expect(remToPx(0, 16)).toBe(0)
    })

    // Negative values
    it('should convert -1rem to -16px with base 16', () => {
      expect(remToPx(-1, 16)).toBe(-16)
    })

    // Large values
    it('should convert 100rem to 1600px with base 16', () => {
      expect(remToPx(100, 16)).toBe(1600)
    })
  })

  describe('solvePxRem', () => {
    const baseInput = { base: '16', lastEdited: 'px' as const, px: '', rem: '' }

    describe('source = "px"', () => {
      it('converts typed px to rem and preserves px', () => {
        expect(solvePxRem({ ...baseInput, px: '32', source: 'px' })).toEqual({ base: '16', px: '32', rem: '2' })
      })

      it('throws INVALID_PX_MSG when px is not a number', () => {
        expect(() => solvePxRem({ ...baseInput, px: 'abc', source: 'px' })).toThrow(/PX value/)
      })

      it('uses a custom base', () => {
        expect(solvePxRem({ ...baseInput, base: '20', px: '20', source: 'px' })).toEqual({
          base: '20',
          px: '20',
          rem: '1',
        })
      })
    })

    describe('source = "rem"', () => {
      it('converts typed rem to px and preserves rem', () => {
        expect(solvePxRem({ ...baseInput, rem: '0.5', source: 'rem' })).toEqual({ base: '16', px: '8', rem: '0.5' })
      })

      it('throws INVALID_REM_MSG when rem is not a number', () => {
        expect(() => solvePxRem({ ...baseInput, rem: 'xyz', source: 'rem' })).toThrow(/REM value/)
      })
    })

    describe('source = "base"', () => {
      it('recomputes rem when lastEdited = px and px is non-empty', () => {
        expect(solvePxRem({ base: '20', lastEdited: 'px', px: '20', rem: '1', source: 'base' })).toEqual({
          base: '20',
          px: '20',
          rem: '1',
        })
      })

      it('recomputes px when lastEdited = rem and rem is non-empty', () => {
        expect(solvePxRem({ base: '10', lastEdited: 'rem', px: '16', rem: '1', source: 'base' })).toEqual({
          base: '10',
          px: '10',
          rem: '1',
        })
      })

      it('leaves px and rem alone when both are empty', () => {
        expect(solvePxRem({ base: '20', lastEdited: 'px', px: '', rem: '', source: 'base' })).toEqual({
          base: '20',
          px: '',
          rem: '',
        })
      })

      it('leaves the non-lastEdited side alone when it is empty', () => {
        expect(solvePxRem({ base: '20', lastEdited: 'rem', px: '', rem: '', source: 'base' })).toEqual({
          base: '20',
          px: '',
          rem: '',
        })
      })
    })

    describe('invalid base', () => {
      it('throws when base is empty', () => {
        expect(() => solvePxRem({ ...baseInput, base: '', px: '16', source: 'px' })).toThrow(/Base font size/)
      })

      it('throws when base is not a number', () => {
        expect(() => solvePxRem({ ...baseInput, base: 'foo', px: '16', source: 'px' })).toThrow(/Base font size/)
      })

      it('throws when base is zero', () => {
        expect(() => solvePxRem({ ...baseInput, base: '0', px: '16', source: 'px' })).toThrow(/Base font size/)
      })

      it('throws when base is negative', () => {
        expect(() => solvePxRem({ ...baseInput, base: '-16', px: '16', source: 'px' })).toThrow(/Base font size/)
      })
    })
  })
})
