import { describe, expect, it } from 'vitest'

import { FAVICON_SIZES, generateFaviconLinkTags } from './favicon'

describe('favicon utils', () => {
  describe('FAVICON_SIZES', () => {
    it('has 6 entries', () => {
      expect(FAVICON_SIZES).toHaveLength(6)
    })

    it('contains correct dimensions', () => {
      const dimensions = FAVICON_SIZES.map((s) => `${s.width}x${s.height}`)
      expect(dimensions).toEqual(['16x16', '32x32', '48x48', '180x180', '192x192', '512x512'])
    })

    it('uses apple-touch-icon.png for 180x180', () => {
      const appleIcon = FAVICON_SIZES.find((s) => s.width === 180)
      expect(appleIcon?.name).toBe('apple-touch-icon.png')
      expect(appleIcon?.rel).toBe('apple-touch-icon')
    })

    it('uses favicon-WxH.png naming for non-apple sizes', () => {
      const nonApple = FAVICON_SIZES.filter((s) => s.rel !== 'apple-touch-icon')
      for (const size of nonApple) {
        expect(size.name).toBe(`favicon-${size.width}x${size.height}.png`)
      }
    })
  })

  describe('generateFaviconLinkTags', () => {
    it('returns correct HTML link tags', () => {
      const tags = generateFaviconLinkTags()
      const lines = tags.split('\n')
      expect(lines).toHaveLength(6)
    })

    it('includes apple-touch-icon for 180x180', () => {
      const tags = generateFaviconLinkTags()
      expect(tags).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">')
    })

    it('includes correct rel and sizes attributes for icon sizes', () => {
      const tags = generateFaviconLinkTags()
      expect(tags).toContain('<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">')
      expect(tags).toContain('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">')
      expect(tags).toContain('<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">')
      expect(tags).toContain('<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">')
      expect(tags).toContain('<link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png">')
    })
  })
})
