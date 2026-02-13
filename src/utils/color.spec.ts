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

  describe('3-digit shorthand hex', () => {
    it('should convert #f00 to rgb(255, 0, 0)', () => {
      const result = convertColor('#f00', 'hex')

      expect(result.rgb).toBe('rgb(255, 0, 0)')
      expect(result.hex).toBe('#f00')
    })

    it('should convert #abc to the correct RGB values', () => {
      const result = convertColor('#abc', 'hex')

      expect(result.rgb).toBe('rgb(170, 187, 204)')
    })

    it('should convert #fff to rgb(255, 255, 255)', () => {
      const result = convertColor('#fff', 'hex')

      expect(result.rgb).toBe('rgb(255, 255, 255)')
    })

    it('should convert #000 to rgb(0, 0, 0)', () => {
      const result = convertColor('#000', 'hex')

      expect(result.rgb).toBe('rgb(0, 0, 0)')
    })
  })

  describe('Hex without # prefix', () => {
    it('should convert ff0000 (without #) to rgb(255, 0, 0)', () => {
      const result = convertColor('ff0000', 'hex')

      expect(result.rgb).toBe('rgb(255, 0, 0)')
    })

    it('should convert abc (3-digit without #) to correct RGB', () => {
      const result = convertColor('abc', 'hex')

      expect(result.rgb).toBe('rgb(170, 187, 204)')
    })
  })

  describe('8-digit hex with alpha', () => {
    it('should throw for 8-digit hex (alpha not supported)', () => {
      expect(() => convertColor('#ff000080', 'hex')).toThrow()
    })
  })

  describe('Pure colors', () => {
    it('should convert pure black #000000', () => {
      const result = convertColor('#000000', 'hex')

      expect(result.rgb).toBe('rgb(0, 0, 0)')
      expect(result.hsl).toBe('hsl(0.00 0.00% 0.00%)')
    })

    it('should convert pure white #ffffff', () => {
      const result = convertColor('#ffffff', 'hex')

      expect(result.rgb).toBe('rgb(255, 255, 255)')
      expect(result.hsl).toBe('hsl(0.00 0.00% 100.00%)')
    })

    it('should convert pure red #ff0000', () => {
      const result = convertColor('#ff0000', 'hex')

      expect(result.rgb).toBe('rgb(255, 0, 0)')
      expect(result.hsl).toBe('hsl(0.00 100.00% 50.00%)')
    })

    it('should convert pure green #00ff00', () => {
      const result = convertColor('#00ff00', 'hex')

      expect(result.rgb).toBe('rgb(0, 255, 0)')
      expect(result.hsl).toBe('hsl(120.00 100.00% 50.00%)')
    })

    it('should convert pure blue #0000ff', () => {
      const result = convertColor('#0000ff', 'hex')

      expect(result.rgb).toBe('rgb(0, 0, 255)')
      expect(result.hsl).toBe('hsl(240.00 100.00% 50.00%)')
    })
  })

  describe('Boundary values', () => {
    it('should convert rgb(0, 0, 0) — minimum RGB', () => {
      const result = convertColor('rgb(0, 0, 0)', 'rgb')

      expect(result.hex).toBe('#000000')
    })

    it('should convert rgb(255, 255, 255) — maximum RGB', () => {
      const result = convertColor('rgb(255, 255, 255)', 'rgb')

      expect(result.hex).toBe('#ffffff')
    })

    it('should convert hsl(0 0% 0%) — minimum HSL', () => {
      const result = convertColor('hsl(0 0% 0%)', 'hsl')

      expect(result.hex).toBe('#000000')
    })

    it('should convert hsl(0 0% 100%) — white in HSL', () => {
      const result = convertColor('hsl(0 0% 100%)', 'hsl')

      expect(result.hex).toBe('#ffffff')
    })

    it('should convert hsl(0 100% 50%) — saturated red in HSL', () => {
      const result = convertColor('hsl(0 100% 50%)', 'hsl')

      expect(result.hex).toBe('#ff0000')
    })

    it('should convert oklch(0 0 0) — minimum OKLCH', () => {
      const result = convertColor('oklch(0 0 0)', 'oklch')

      expect(result.hex).toBe('#000000')
    })

    it('should convert oklch(1 0 0) — maximum lightness OKLCH', () => {
      const result = convertColor('oklch(1 0 0)', 'oklch')

      expect(result.hex).toBe('#ffffff')
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

  describe('Out-of-range values', () => {
    it('should throw for rgb(256, 0, 0) — red out of range', () => {
      expect(() => convertColor('rgb(256, 0, 0)', 'rgb')).toThrow()
    })

    it('should throw for rgb(0, -1, 0) — negative value', () => {
      expect(() => convertColor('rgb(0, -1, 0)', 'rgb')).toThrow()
    })

    it('should throw for hsl(360 101% 50%) — saturation out of range', () => {
      expect(() => convertColor('hsl(360 101% 50%)', 'hsl')).toThrow()
    })

    it('should throw for hsl(0 0% 101%) — lightness out of range', () => {
      expect(() => convertColor('hsl(0 0% 101%)', 'hsl')).toThrow()
    })
  })

  describe('Empty and whitespace input', () => {
    it('should throw for empty string hex input', () => {
      expect(() => convertColor('', 'hex')).toThrow()
    })

    it('should throw for empty string rgb input', () => {
      expect(() => convertColor('', 'rgb')).toThrow()
    })

    it('should throw for empty string hsl input', () => {
      expect(() => convertColor('', 'hsl')).toThrow()
    })

    it('should throw for empty string oklch input', () => {
      expect(() => convertColor('', 'oklch')).toThrow()
    })

    it('should throw for empty string lab input', () => {
      expect(() => convertColor('', 'lab')).toThrow()
    })

    it('should throw for empty string lch input', () => {
      expect(() => convertColor('', 'lch')).toThrow()
    })

    it('should throw for whitespace-only hex input', () => {
      expect(() => convertColor('   ', 'hex')).toThrow()
    })

    it('should throw for whitespace-only rgb input', () => {
      expect(() => convertColor('   ', 'rgb')).toThrow()
    })
  })

  describe('OKLCH, LAB, LCH format tests', () => {
    it('should convert lab(0 0 0) — black in LAB', () => {
      const result = convertColor('lab(0 0 0)', 'lab')

      expect(result.hex).toBe('#000000')
    })

    it('should convert lab(100 0 0) — white in LAB', () => {
      const result = convertColor('lab(100 0 0)', 'lab')

      expect(result.hex).toBe('#ffffff')
    })

    it('should convert lch(0 0 0) — black in LCH', () => {
      const result = convertColor('lch(0 0 0)', 'lch')

      expect(result.hex).toBe('#000000')
    })

    it('should convert lch(100 0 0) — white in LCH', () => {
      const result = convertColor('lch(100 0 0)', 'lch')

      expect(result.hex).toBe('#ffffff')
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

    it('should round-trip hex → rgb → hsl → hex consistently', () => {
      const hex = '#3b82f6'
      const fromHex = convertColor(hex, 'hex')
      const fromRgb = convertColor(fromHex.rgb, 'rgb')
      const fromHsl = convertColor(fromRgb.hsl, 'hsl')

      expect(fromHex.hex).toBe(fromRgb.hex)
      expect(fromRgb.hex).toBe(fromHsl.hex)
    })

    it('should round-trip hex → lab → lch → hex consistently', () => {
      const hex = '#3b82f6'
      const fromHex = convertColor(hex, 'hex')
      const fromLab = convertColor(fromHex.lab, 'lab')
      const fromLch = convertColor(fromLab.lch, 'lch')

      expect(fromHex.hex).toBe(fromLab.hex)
      expect(fromLab.hex).toBe(fromLch.hex)
    })

    it('should round-trip hex → oklch → hex consistently', () => {
      const hex = '#3b82f6'
      const fromHex = convertColor(hex, 'hex')
      const fromOklch = convertColor(fromHex.oklch, 'oklch')

      expect(fromHex.hex).toBe(fromOklch.hex)
    })

    it('should round-trip rgb → oklch → rgb consistently', () => {
      const rgb = 'rgb(59, 130, 246)'
      const fromRgb = convertColor(rgb, 'rgb')
      const fromOklch = convertColor(fromRgb.oklch, 'oklch')

      expect(fromRgb.hex).toBe(fromOklch.hex)
      expect(fromRgb.rgb).toBe(fromOklch.rgb)
    })

    it('should round-trip hsl → lab → hsl consistently', () => {
      const hsl = 'hsl(217 91% 60%)'
      const fromHsl = convertColor(hsl, 'hsl')
      const fromLab = convertColor(fromHsl.lab, 'lab')

      expect(fromHsl.hex).toBe(fromLab.hex)
      expect(fromHsl.rgb).toBe(fromLab.rgb)
    })

    it('should round-trip oklch → lch → oklch consistently', () => {
      const oklch = 'oklch(0.6655 0.0797 18.38)'
      const fromOklch = convertColor(oklch, 'oklch')
      const fromLch = convertColor(fromOklch.lch, 'lch')

      expect(fromOklch.hex).toBe(fromLch.hex)
      expect(fromOklch.oklch).toBe(fromLch.oklch)
    })

    it('should round-trip lab → rgb → lab consistently', () => {
      const lab = 'lab(54 -4 49)'
      const fromLab = convertColor(lab, 'lab')
      const fromRgb = convertColor(fromLab.rgb, 'rgb')

      expect(fromLab.hex).toBe(fromRgb.hex)
      expect(fromLab.rgb).toBe(fromRgb.rgb)
    })
  })
})
