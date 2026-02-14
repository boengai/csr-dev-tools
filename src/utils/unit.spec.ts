import { describe, expect, it } from 'vitest'

import { pxToRem, remToPx } from '@/utils/unit'

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
})
