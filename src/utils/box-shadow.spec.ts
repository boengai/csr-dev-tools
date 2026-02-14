import { describe, expect, it } from 'vitest'

import { DEFAULT_BOX_SHADOW, generateBoxShadowCSS, hexToRgba } from '@/utils/box-shadow'

describe('box-shadow utilities', () => {
  describe('hexToRgba', () => {
    it('should convert black hex to rgba', () => {
      expect(hexToRgba('#000000', 25)).toBe('rgba(0, 0, 0, 0.25)')
    })

    it('should convert color hex to rgba', () => {
      expect(hexToRgba('#ff5733', 50)).toBe('rgba(255, 87, 51, 0.5)')
    })

    it('should handle 3-char hex', () => {
      expect(hexToRgba('#fff', 100)).toBe('rgba(255, 255, 255, 1)')
    })

    it('should handle hex without hash', () => {
      expect(hexToRgba('ff0000', 75)).toBe('rgba(255, 0, 0, 0.75)')
    })

    it('should handle zero alpha', () => {
      expect(hexToRgba('#000000', 0)).toBe('rgba(0, 0, 0, 0)')
    })

    it('should handle full alpha', () => {
      expect(hexToRgba('#000000', 100)).toBe('rgba(0, 0, 0, 1)')
    })
  })

  describe('generateBoxShadowCSS', () => {
    it('should generate default shadow CSS', () => {
      expect(generateBoxShadowCSS(DEFAULT_BOX_SHADOW)).toBe('4px 4px 8px 0px rgba(0, 0, 0, 0.25)')
    })

    it('should generate inset shadow CSS', () => {
      expect(generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, inset: true })).toBe(
        'inset 4px 4px 8px 0px rgba(0, 0, 0, 0.25)',
      )
    })

    it('should handle zero values', () => {
      expect(
        generateBoxShadowCSS({ alpha: 25, blur: 0, color: '#000000', hOffset: 0, inset: false, spread: 0, vOffset: 0 }),
      ).toBe('0px 0px 0px 0px rgba(0, 0, 0, 0.25)')
    })

    it('should handle negative offsets', () => {
      expect(generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, hOffset: -10, vOffset: -5 })).toBe(
        '-10px -5px 8px 0px rgba(0, 0, 0, 0.25)',
      )
    })

    it('should handle negative spread', () => {
      expect(generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, spread: -2 })).toBe('4px 4px 8px -2px rgba(0, 0, 0, 0.25)')
    })

    it('should handle custom color with alpha', () => {
      expect(generateBoxShadowCSS({ ...DEFAULT_BOX_SHADOW, alpha: 80, color: '#ff0000' })).toBe(
        '4px 4px 8px 0px rgba(255, 0, 0, 0.8)',
      )
    })

    it('should handle max values', () => {
      expect(
        generateBoxShadowCSS({
          alpha: 100,
          blur: 200,
          color: '#ffffff',
          hOffset: 100,
          inset: false,
          spread: 100,
          vOffset: 100,
        }),
      ).toBe('100px 100px 200px 100px rgba(255, 255, 255, 1)')
    })
  })

  describe('DEFAULT_BOX_SHADOW', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_BOX_SHADOW).toEqual({
        alpha: 25,
        blur: 8,
        color: '#000000',
        hOffset: 4,
        inset: false,
        spread: 0,
        vOffset: 4,
      })
    })
  })
})
