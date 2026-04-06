import { describe, expect, it } from 'vitest'

import type { HSLColor } from '@/types'
import {
  formatPaletteAsCss,
  generateAnalogousPalette,
  generateComplementaryPalette,
  generateMonochromaticPalette,
  generatePalette,
  generateSplitComplementaryPalette,
  generateTriadicPalette,
} from '@/utils'

describe('color-palette', () => {
  const baseHsl: HSLColor = { h: 217, l: 59.8, s: 91.18 } // ~#3b82f6

  describe('generateComplementaryPalette', () => {
    it('should return 5 colors', async () => {
      const palette = await generateComplementaryPalette(baseHsl)
      expect(palette).toHaveLength(5)
    })

    it('should have the base color as the first swatch', async () => {
      const palette = await generateComplementaryPalette(baseHsl)
      expect(palette[0].hsl.h).toBeCloseTo(217, 0)
    })

    it('should include a complement at hue+180', async () => {
      const palette = await generateComplementaryPalette(baseHsl)
      expect(palette[2].hsl.h).toBeCloseTo(37, 0) // 217+180=397 → 37
    })

    it('should include lightness variants for padding to 5', async () => {
      const palette = await generateComplementaryPalette(baseHsl)
      // Darker variant of base
      expect(palette[1].hsl.l).toBeCloseTo(baseHsl.l - 15, 0)
      // Lighter/darker variants of complement
      expect(palette[3].hsl.l).toBeCloseTo(baseHsl.l - 15, 0)
      expect(palette[4].hsl.l).toBeCloseTo(baseHsl.l + 15, 0)
    })
  })

  describe('generateAnalogousPalette', () => {
    it('should return 5 colors', async () => {
      const palette = await generateAnalogousPalette(baseHsl)
      expect(palette).toHaveLength(5)
    })

    it('should have the base color as the middle swatch', async () => {
      const palette = await generateAnalogousPalette(baseHsl)
      expect(palette[2].hsl.h).toBeCloseTo(217, 0)
    })

    it('should space hues at -60, -30, 0, +30, +60 from base', async () => {
      const palette = await generateAnalogousPalette(baseHsl)
      expect(palette[0].hsl.h).toBeCloseTo(157, 0) // 217-60
      expect(palette[1].hsl.h).toBeCloseTo(187, 0) // 217-30
      expect(palette[2].hsl.h).toBeCloseTo(217, 0) // base
      expect(palette[3].hsl.h).toBeCloseTo(247, 0) // 217+30
      expect(palette[4].hsl.h).toBeCloseTo(277, 0) // 217+60
    })

    it('should preserve saturation and lightness for all colors', async () => {
      const palette = await generateAnalogousPalette(baseHsl)
      for (const color of palette) {
        expect(color.hsl.s).toBeCloseTo(baseHsl.s, 0)
        expect(color.hsl.l).toBeCloseTo(baseHsl.l, 0)
      }
    })
  })

  describe('generateTriadicPalette', () => {
    it('should return 5 colors', async () => {
      const palette = await generateTriadicPalette(baseHsl)
      expect(palette).toHaveLength(5)
    })

    it('should have 3 primary colors at 120-degree intervals', async () => {
      const palette = await generateTriadicPalette(baseHsl)
      expect(palette[0].hsl.h).toBeCloseTo(217, 0) // base
      expect(palette[1].hsl.h).toBeCloseTo(337, 0) // 217+120
      expect(palette[3].hsl.h).toBeCloseTo(97, 0) // 217+240=457 → 97
    })

    it('should pad with lightness variants to reach 5 colors', async () => {
      const palette = await generateTriadicPalette(baseHsl)
      expect(palette[2].hsl.l).toBeCloseTo(baseHsl.l + 15, 0)
      expect(palette[4].hsl.l).toBeCloseTo(baseHsl.l + 15, 0)
    })
  })

  describe('generateSplitComplementaryPalette', () => {
    it('should return 5 colors', async () => {
      const palette = await generateSplitComplementaryPalette(baseHsl)
      expect(palette).toHaveLength(5)
    })

    it('should have base at position 0 and split complements at 150/210 degrees', async () => {
      const palette = await generateSplitComplementaryPalette(baseHsl)
      expect(palette[0].hsl.h).toBeCloseTo(217, 0) // base
      expect(palette[1].hsl.h).toBeCloseTo(7, 0) // 217+150=367 → 7
      expect(palette[3].hsl.h).toBeCloseTo(67, 0) // 217+210=427 → 67
    })

    it('should pad with lightness variants', async () => {
      const palette = await generateSplitComplementaryPalette(baseHsl)
      expect(palette[2].hsl.l).toBeCloseTo(baseHsl.l + 15, 0)
      expect(palette[4].hsl.l).toBeCloseTo(baseHsl.l + 15, 0)
    })
  })

  describe('generateMonochromaticPalette', () => {
    it('should return 5 colors', async () => {
      const palette = await generateMonochromaticPalette(baseHsl)
      expect(palette).toHaveLength(5)
    })

    it('should preserve hue and saturation across all colors', async () => {
      const palette = await generateMonochromaticPalette(baseHsl)
      for (const color of palette) {
        expect(color.hsl.h).toBeCloseTo(217, 0)
        expect(color.hsl.s).toBeCloseTo(baseHsl.s, 0)
      }
    })

    it('should vary lightness at 15%, 30%, 50%, 70%, 85%', async () => {
      const palette = await generateMonochromaticPalette(baseHsl)
      expect(palette[0].hsl.l).toBeCloseTo(15, 0)
      expect(palette[1].hsl.l).toBeCloseTo(30, 0)
      expect(palette[2].hsl.l).toBeCloseTo(50, 0)
      expect(palette[3].hsl.l).toBeCloseTo(70, 0)
      expect(palette[4].hsl.l).toBeCloseTo(85, 0)
    })
  })

  describe('generatePalette (orchestrator)', () => {
    it('should generate complementary palette from hex input', async () => {
      const palette = await generatePalette('#3b82f6', 'complementary')
      expect(palette).toHaveLength(5)
    })

    it('should generate analogous palette from hex input', async () => {
      const palette = await generatePalette('#3b82f6', 'analogous')
      expect(palette).toHaveLength(5)
    })

    it('should generate triadic palette from hex input', async () => {
      const palette = await generatePalette('#3b82f6', 'triadic')
      expect(palette).toHaveLength(5)
    })

    it('should generate split-complementary palette from hex input', async () => {
      const palette = await generatePalette('#3b82f6', 'split-complementary')
      expect(palette).toHaveLength(5)
    })

    it('should generate monochromatic palette from hex input', async () => {
      const palette = await generatePalette('#3b82f6', 'monochromatic')
      expect(palette).toHaveLength(5)
    })

    it('should include hex, rgb, and hsl in each palette color', async () => {
      const palette = await generatePalette('#3b82f6', 'analogous')
      for (const color of palette) {
        expect(color.hex).toMatch(/^#[0-9a-f]{6}$/)
        expect(color.rgb).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
        expect(color.hsl).toHaveProperty('h')
        expect(color.hsl).toHaveProperty('s')
        expect(color.hsl).toHaveProperty('l')
      }
    })
  })

  describe('edge cases', () => {
    it('should handle black (h=0, s=0, l=0)', async () => {
      const black: HSLColor = { h: 0, l: 0, s: 0 }
      const palette = await generateComplementaryPalette(black)
      expect(palette).toHaveLength(5)
      // Lightness should clamp to 0 minimum
      expect(palette[1].hsl.l).toBe(0) // 0-15 clamped to 0
    })

    it('should handle white (h=0, s=0, l=100)', async () => {
      const white: HSLColor = { h: 0, l: 100, s: 0 }
      const palette = await generateComplementaryPalette(white)
      expect(palette).toHaveLength(5)
      // Lightness should clamp to 100 max
      expect(palette[4].hsl.l).toBe(100) // 100+15 clamped to 100
    })

    it('should handle pure red (h=0)', async () => {
      const red: HSLColor = { h: 0, l: 50, s: 100 }
      const palette = await generateComplementaryPalette(red)
      expect(palette[0].hsl.h).toBeCloseTo(0, 0)
      expect(palette[2].hsl.h).toBeCloseTo(180, 0) // complement
    })

    it('should handle pure green (h=120)', async () => {
      const green: HSLColor = { h: 120, l: 50, s: 100 }
      const palette = await generateTriadicPalette(green)
      expect(palette[0].hsl.h).toBeCloseTo(120, 0)
      expect(palette[1].hsl.h).toBeCloseTo(240, 0)
      expect(palette[3].hsl.h).toBeCloseTo(0, 0)
    })

    it('should handle pure blue (h=240)', async () => {
      const blue: HSLColor = { h: 240, l: 50, s: 100 }
      const palette = await generateAnalogousPalette(blue)
      expect(palette[0].hsl.h).toBeCloseTo(180, 0) // 240-60
      expect(palette[4].hsl.h).toBeCloseTo(300, 0) // 240+60
    })

    it('should handle hue wrapping at 360 degrees', async () => {
      const nearMax: HSLColor = { h: 350, l: 50, s: 100 }
      const palette = await generateAnalogousPalette(nearMax)
      expect(palette[3].hsl.h).toBeCloseTo(20, 0) // 350+30=380 → 20
      expect(palette[4].hsl.h).toBeCloseTo(50, 0) // 350+60=410 → 50
    })

    it('should handle 3-digit hex input', async () => {
      const palette = await generatePalette('#f00', 'complementary')
      expect(palette).toHaveLength(5)
      expect(palette[0].hsl.h).toBeCloseTo(0, 0)
    })
  })

  describe('formatPaletteAsCss', () => {
    it('should generate valid CSS custom properties', async () => {
      const palette = await generatePalette('#3b82f6', 'analogous')
      const css = formatPaletteAsCss(palette)
      const lines = css.split('\n')
      expect(lines).toHaveLength(5)
      expect(lines[0]).toMatch(/^--palette-1: #[0-9a-f]{6};$/)
      expect(lines[4]).toMatch(/^--palette-5: #[0-9a-f]{6};$/)
    })

    it('should use lowercase hex values', async () => {
      const palette = await generatePalette('#FF0000', 'monochromatic')
      const css = formatPaletteAsCss(palette)
      expect(css).not.toMatch(/[A-F]/)
    })

    it('should number palettes starting from 1', async () => {
      const palette = await generatePalette('#3b82f6', 'triadic')
      const css = formatPaletteAsCss(palette)
      expect(css).toContain('--palette-1:')
      expect(css).toContain('--palette-5:')
      expect(css).not.toContain('--palette-0:')
      expect(css).not.toContain('--palette-6:')
    })
  })

  describe('invalid input handling', () => {
    it('should throw on invalid hex input', async () => {
      await expect(generatePalette('not-a-color', 'analogous')).rejects.toThrow()
    })

    it('should throw on empty string input', async () => {
      await expect(generatePalette('', 'analogous')).rejects.toThrow()
    })
  })
})
