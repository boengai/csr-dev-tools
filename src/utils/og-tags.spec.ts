import { describe, expect, it } from 'vitest'

import { generateOgMetaTags, type OgConfig } from './og-tags'

const fullConfig: OgConfig = {
  description: 'A great page about awesome things',
  image: 'https://example.com/image.png',
  siteName: 'Example',
  title: 'My Awesome Page',
  url: 'https://example.com/page',
}

describe('og-tags', () => {
  describe('generateOgMetaTags', () => {
    it('generates all og and twitter tags for full config', () => {
      const result = generateOgMetaTags(fullConfig)
      expect(result).toContain('og:title')
      expect(result).toContain('og:description')
      expect(result).toContain('og:image')
      expect(result).toContain('og:site_name')
      expect(result).toContain('og:url')
      expect(result).toContain('og:type')
      expect(result).toContain('twitter:card')
      expect(result).toContain('twitter:title')
      expect(result).toContain('twitter:description')
      expect(result).toContain('twitter:image')
    })

    it('generates only provided fields for partial config', () => {
      const result = generateOgMetaTags({ description: '', image: '', siteName: '', title: 'Only Title', url: '' })
      expect(result).toContain('og:title')
      expect(result).not.toContain('og:description')
      expect(result).not.toContain('og:image')
      expect(result).not.toContain('og:site_name')
      expect(result).not.toContain('og:url')
    })

    it('returns empty string for empty config', () => {
      const result = generateOgMetaTags({ description: '', image: '', siteName: '', title: '', url: '' })
      expect(result).toBe('')
    })

    it('sets twitter:card to summary_large_image when image is provided', () => {
      const result = generateOgMetaTags({ ...fullConfig })
      expect(result).toContain('content="summary_large_image"')
    })

    it('sets twitter:card to summary when no image', () => {
      const result = generateOgMetaTags({ ...fullConfig, image: '' })
      expect(result).toContain('content="summary"')
      expect(result).not.toContain('summary_large_image')
    })

    it('escapes HTML special characters in values', () => {
      const result = generateOgMetaTags({
        description: 'Tom & Jerry "show" <script>',
        image: '',
        siteName: '',
        title: 'A & B',
        url: '',
      })
      expect(result).toContain('&amp;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })

    it('does not include twitter:image when no image provided', () => {
      const result = generateOgMetaTags({ ...fullConfig, image: '' })
      expect(result).not.toContain('twitter:image')
    })
  })
})
