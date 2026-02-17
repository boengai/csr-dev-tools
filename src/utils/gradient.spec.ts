import { describe, expect, it } from 'vitest'

import { DEFAULT_GRADIENT, generateGradientCss } from '@/utils/gradient'

describe('gradient utilities', () => {
  describe('generateGradientCss', () => {
    it('should generate linear gradient with default config', () => {
      expect(generateGradientCss(DEFAULT_GRADIENT.type, DEFAULT_GRADIENT.angle, DEFAULT_GRADIENT.stops)).toBe(
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      )
    })

    it('should generate radial gradient', () => {
      expect(
        generateGradientCss('radial', 0, [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 100 },
        ]),
      ).toBe('radial-gradient(circle, #ff0000 0%, #0000ff 100%)')
    })

    it('should sort stops by position', () => {
      expect(
        generateGradientCss('linear', 90, [
          { color: '#0000ff', position: 100 },
          { color: '#ff0000', position: 0 },
          { color: '#00ff00', position: 50 },
        ]),
      ).toBe('linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)')
    })

    it('should handle single stop', () => {
      expect(generateGradientCss('linear', 0, [{ color: '#ff0000', position: 50 }])).toBe(
        'linear-gradient(0deg, #ff0000 50%)',
      )
    })

    it('should handle 0 degree angle', () => {
      expect(
        generateGradientCss('linear', 0, [
          { color: '#000', position: 0 },
          { color: '#fff', position: 100 },
        ]),
      ).toBe('linear-gradient(0deg, #000 0%, #fff 100%)')
    })

    it('should handle 360 degree angle', () => {
      expect(
        generateGradientCss('linear', 360, [
          { color: '#000', position: 0 },
          { color: '#fff', position: 100 },
        ]),
      ).toBe('linear-gradient(360deg, #000 0%, #fff 100%)')
    })

    it('should ignore angle for radial gradients', () => {
      expect(
        generateGradientCss('radial', 180, [
          { color: '#000', position: 0 },
          { color: '#fff', position: 100 },
        ]),
      ).toBe('radial-gradient(circle, #000 0%, #fff 100%)')
    })
  })

  describe('DEFAULT_GRADIENT', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_GRADIENT).toEqual({
        angle: 135,
        stops: [
          { color: '#667eea', position: 0 },
          { color: '#764ba2', position: 100 },
        ],
        type: 'linear',
      })
    })
  })
})
