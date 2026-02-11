import { describe, expect, it } from 'vitest'

import type { ColorFormat } from '@/types'

import { convertColor } from './color'

describe('Color Utilities', () => {
  const EXAMPLE_RESULT: Record<ColorFormat, string> = {
    hex: '#c08081',
    hsl: 'hsl(359.06 33.68% 62.75%)',
    lab: 'lab(60.10 24.90 9.63)',
    lch: 'lch(60.10 26.70 21.15)',
    oklch: 'oklch(0.6655 0.0797 18.38)',
    rgb: 'rgb(192, 128, 129)',
  }

  describe('convertColor', () => {
    it(`should convert hex color ${EXAMPLE_RESULT.hex} to all formats correctly`, () => {
      const result = convertColor(EXAMPLE_RESULT.hex, 'hex')

      expect(result).toEqual(EXAMPLE_RESULT)
    })

    it(`should convert RGB color ${EXAMPLE_RESULT.rgb} to all formats correctly`, () => {
      const result = convertColor(EXAMPLE_RESULT.rgb, 'rgb')

      expect(result).toEqual(EXAMPLE_RESULT)
    })

    it(`should convert HSL color ${EXAMPLE_RESULT.hsl} to all formats correctly`, () => {
      const result = convertColor(EXAMPLE_RESULT.hsl, 'hsl')

      expect(result).toEqual(EXAMPLE_RESULT)
    })

    it(`should convert LAB color ${EXAMPLE_RESULT.lab} to all formats correctly`, () => {
      const result = convertColor(EXAMPLE_RESULT.lab, 'lab')

      expect(result).toEqual(EXAMPLE_RESULT)
    })

    it(`should convert LCH color ${EXAMPLE_RESULT.lch} to all formats correctly`, () => {
      const result = convertColor(EXAMPLE_RESULT.lch, 'lch')

      expect(result).toEqual(EXAMPLE_RESULT)
    })

    it(`should convert OKLCH color ${EXAMPLE_RESULT.oklch} to all formats correctly`, () => {
      const result = convertColor(EXAMPLE_RESULT.oklch, 'oklch')

      expect(result).toEqual(EXAMPLE_RESULT)
    })
  })

  describe('Error handling', () => {
    it('should throw error for invalid hex format', () => {
      expect(() => convertColor('#invalid', 'hex')).toThrow()
      expect(() => convertColor('invalid', 'hex')).toThrow()
      expect(() => convertColor('#12345', 'hex')).toThrow()
    })

    it('should throw error for invalid RGB format', () => {
      expect(() => convertColor('rgb(invalid)', 'rgb')).toThrow()
      expect(() => convertColor('rgb(256, 0, 0)', 'rgb')).toThrow()
      expect(() => convertColor('rgb(0, 256, 0)', 'rgb')).toThrow()
      expect(() => convertColor('rgb(0, 0, 256)', 'rgb')).toThrow()
    })

    it('should throw error for invalid HSL format', () => {
      expect(() => convertColor('hsl(invalid)', 'hsl')).toThrow()
      expect(() => convertColor('hsl(0, 101%, 50%)', 'hsl')).toThrow()
      expect(() => convertColor('hsl(0, 0%, 101%)', 'hsl')).toThrow()
    })

    it('should throw error for invalid LAB format', () => {
      expect(() => convertColor('lab(invalid)', 'lab')).toThrow()
    })

    it('should throw error for invalid LCH format', () => {
      expect(() => convertColor('lch(invalid)', 'lch')).toThrow()
    })

    it('should throw error for invalid OKLCH format', () => {
      expect(() => convertColor('oklch(invalid)', 'oklch')).toThrow()
    })

    it('should throw error for unsupported color format', () => {
      expect(() => convertColor('#ff0000', 'unsupported' as ColorFormat)).toThrow()
    })
  })

  describe('Color format consistency', () => {
    it('should maintain color consistency across multiple conversions', () => {
      const originalHex = EXAMPLE_RESULT.hex
      const firstConversion = convertColor(originalHex, 'hex')
      const secondConversion = convertColor(firstConversion.rgb, 'rgb')
      const thirdConversion = convertColor(secondConversion.hsl, 'hsl')

      // All conversions should produce the same result
      expect(firstConversion.hex).toBe(secondConversion.hex)
      expect(secondConversion.hex).toBe(thirdConversion.hex)
      expect(firstConversion.rgb).toBe(secondConversion.rgb)
      expect(secondConversion.rgb).toBe(thirdConversion.rgb)
    })

    it('should handle precision correctly', () => {
      const result = convertColor('#c08081', 'hex')

      // Check that values are properly rounded/formatted
      expect(result.hsl).toMatch(/^hsl\([\d.]+ [\d.]+% [\d.]+%\)$/)
      expect(result.lab).toMatch(/^lab\([\d.]+ [\d.]+ [\d.]+\)$/)
      expect(result.lch).toMatch(/^lch\([\d.]+ [\d.]+ [\d.]+\)$/)
      expect(result.oklch).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/)
      expect(result.rgb).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
    })
  })
})
