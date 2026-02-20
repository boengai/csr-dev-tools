import { describe, expect, it } from 'vitest'

import { base64ToImageInfo, detectFormatFromBase64 } from './base64-image'

describe('base64-image', () => {
  it('module exports base64ToImageInfo', () => {
    expect(typeof base64ToImageInfo).toBe('function')
  })

  describe('detectFormatFromBase64', () => {
    it('detects PNG from magic bytes', () => {
      expect(detectFormatFromBase64('iVBORw0KGgoAAAANSUhEUg')).toBe('png')
    })

    it('detects JPEG from magic bytes', () => {
      expect(detectFormatFromBase64('/9j/4AAQSkZJRgABAQ')).toBe('jpeg')
    })

    it('detects GIF from magic bytes', () => {
      expect(detectFormatFromBase64('R0lGODlhAQABAIAAAP')).toBe('gif')
    })

    it('detects WebP from magic bytes', () => {
      expect(detectFormatFromBase64('UklGRlYAAABXRUJQ')).toBe('webp')
    })

    it('detects BMP from magic bytes', () => {
      expect(detectFormatFromBase64('Qk0AAAAAAAAANAA')).toBe('bmp')
    })

    it('detects SVG from <svg prefix', () => {
      expect(detectFormatFromBase64('PHN2ZyB4bWxucz0i')).toBe('svg+xml')
    })

    it('detects SVG from <?xml prefix', () => {
      expect(detectFormatFromBase64('PD94bWwgdmVyc2lvbj0i')).toBe('svg+xml')
    })

    it('returns null for unknown format', () => {
      expect(detectFormatFromBase64('AAAAAAAAAA')).toBeNull()
    })
  })
})
