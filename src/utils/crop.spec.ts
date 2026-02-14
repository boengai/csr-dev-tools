import { describe, expect, it } from 'vitest'

import { ASPECT_RATIO_OPTIONS, clampCropRegion, getAspectRatio, getDefaultCrop, scaleCropToNatural } from '@/utils'

describe('crop utilities', () => {
  describe('ASPECT_RATIO_OPTIONS', () => {
    it('contains 5 presets', () => {
      expect(ASPECT_RATIO_OPTIONS).toHaveLength(5)
    })

    it('contains all expected presets', () => {
      const values = ASPECT_RATIO_OPTIONS.map((o) => o.value)
      expect(values).toContain('free')
      expect(values).toContain('16:9')
      expect(values).toContain('4:3')
      expect(values).toContain('1:1')
      expect(values).toContain('3:2')
    })
  })

  describe('getAspectRatio', () => {
    it('returns undefined for free preset', () => {
      expect(getAspectRatio('free')).toBeUndefined()
    })

    it('returns 16/9 for 16:9 preset', () => {
      expect(getAspectRatio('16:9')).toBeCloseTo(16 / 9)
    })

    it('returns 4/3 for 4:3 preset', () => {
      expect(getAspectRatio('4:3')).toBeCloseTo(4 / 3)
    })

    it('returns 1 for 1:1 preset', () => {
      expect(getAspectRatio('1:1')).toBe(1)
    })

    it('returns 3/2 for 3:2 preset', () => {
      expect(getAspectRatio('3:2')).toBeCloseTo(3 / 2)
    })
  })

  describe('scaleCropToNatural', () => {
    it('scales crop coordinates from display to natural dimensions', () => {
      const result = scaleCropToNatural({ height: 50, width: 100, x: 10, y: 20 }, 500, 400, 1000, 800)

      expect(result).toEqual({ height: 100, width: 200, x: 20, y: 40 })
    })

    it('returns identity when display equals natural dimensions', () => {
      const crop = { height: 100, width: 200, x: 50, y: 30 }
      const result = scaleCropToNatural(crop, 800, 600, 800, 600)

      expect(result).toEqual(crop)
    })

    it('rounds to nearest integer', () => {
      const result = scaleCropToNatural({ height: 33, width: 33, x: 10, y: 10 }, 100, 100, 300, 300)

      expect(result).toEqual({ height: 99, width: 99, x: 30, y: 30 })
    })

    it('handles non-uniform scaling', () => {
      const result = scaleCropToNatural({ height: 50, width: 100, x: 0, y: 0 }, 200, 100, 400, 800)

      expect(result).toEqual({ height: 400, width: 200, x: 0, y: 0 })
    })
  })

  describe('clampCropRegion', () => {
    it('returns unchanged crop when within bounds', () => {
      const crop = { height: 100, width: 200, x: 50, y: 30 }
      const result = clampCropRegion(crop, 800, 600)

      expect(result).toEqual(crop)
    })

    it('clamps negative x and y to 0', () => {
      const result = clampCropRegion({ height: 100, width: 100, x: -10, y: -20 }, 800, 600)

      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('clamps width when it overflows past max', () => {
      const result = clampCropRegion({ height: 100, width: 500, x: 600, y: 0 }, 800, 600)

      expect(result.x).toBe(600)
      expect(result.width).toBe(200)
    })

    it('clamps height when it overflows past max', () => {
      const result = clampCropRegion({ height: 400, width: 100, x: 0, y: 400 }, 800, 600)

      expect(result.y).toBe(400)
      expect(result.height).toBe(200)
    })

    it('clamps x to maxWidth - 1 when x exceeds bounds', () => {
      const result = clampCropRegion({ height: 10, width: 10, x: 1000, y: 0 }, 800, 600)

      expect(result.x).toBe(799)
      expect(result.width).toBe(1)
    })

    it('enforces minimum width and height of 1', () => {
      const result = clampCropRegion({ height: 0, width: 0, x: 0, y: 0 }, 800, 600)

      expect(result.width).toBe(1)
      expect(result.height).toBe(1)
    })

    it('handles negative dimensions by enforcing minimum 1', () => {
      const result = clampCropRegion({ height: -50, width: -50, x: 10, y: 10 }, 800, 600)

      expect(result.width).toBe(1)
      expect(result.height).toBe(1)
    })
  })

  describe('getDefaultCrop', () => {
    it('returns 80% centered crop for freeform', () => {
      const result = getDefaultCrop(1000, 800)

      expect(result.width).toBe(800)
      expect(result.height).toBe(640)
      expect(result.x).toBe(100)
      expect(result.y).toBe(80)
    })

    it('respects aspect ratio constraint', () => {
      const result = getDefaultCrop(1000, 800, 1)

      expect(result.width).toBe(result.height)
    })

    it('clamps height to image height when aspect ratio causes overflow', () => {
      // Very wide aspect ratio on a tall image
      const result = getDefaultCrop(200, 100, 16 / 9)

      expect(result.height).toBeLessThanOrEqual(100)
      expect(result.width).toBeLessThanOrEqual(200)
    })

    it('centers the crop region', () => {
      const result = getDefaultCrop(1000, 1000)

      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
      expect(result.width).toBe(800)
      expect(result.height).toBe(800)
    })

    it('handles landscape image with 1:1 ratio', () => {
      const result = getDefaultCrop(1000, 500, 1)

      // Width starts at 800 (80%), height = 800/1 = 800 but clamped to 500
      // Then width recalculated: 500 * 1 = 500
      expect(result.height).toBe(500)
      expect(result.width).toBe(500)
      expect(result.x).toBe(250)
      expect(result.y).toBe(0)
    })

    it('handles portrait image with freeform', () => {
      const result = getDefaultCrop(400, 800)

      expect(result.width).toBe(320)
      expect(result.height).toBe(640)
      expect(result.x).toBe(40)
      expect(result.y).toBe(80)
    })
  })
})
