import { describe, expect, it } from 'vitest'

import type { PlaceholderOptions } from '@/utils/placeholder-image'

import { generatePlaceholderSvg, PLACEHOLDER_PRESETS } from '@/utils/placeholder-image'

const defaultOptions: PlaceholderOptions = {
  bgColor: '#cccccc',
  height: 600,
  text: '',
  textColor: '#666666',
  width: 800,
}

describe('placeholder-image', () => {
  describe('generatePlaceholderSvg', () => {
    it('returns a valid SVG string with correct dimensions', () => {
      const svg = generatePlaceholderSvg(defaultOptions)
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('width="800"')
      expect(svg).toContain('height="600"')
      expect(svg).toContain('viewBox="0 0 800 600"')
    })

    it('contains a rect element with the background color', () => {
      const svg = generatePlaceholderSvg(defaultOptions)
      expect(svg).toContain('<rect')
      expect(svg).toContain('fill="#cccccc"')
    })

    it('contains a text element with the text color', () => {
      const svg = generatePlaceholderSvg(defaultOptions)
      expect(svg).toContain('<text')
      expect(svg).toContain('fill="#666666"')
    })

    it('uses default text "{W}x{H}" when text is empty', () => {
      const svg = generatePlaceholderSvg(defaultOptions)
      expect(svg).toContain('>800x600</text>')
    })

    it('uses custom text when provided', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, text: 'Hello World' })
      expect(svg).toContain('>Hello World</text>')
      expect(svg).not.toContain('800x600')
    })

    it('has correct text positioning attributes', () => {
      const svg = generatePlaceholderSvg(defaultOptions)
      expect(svg).toContain('text-anchor="middle"')
      expect(svg).toContain('dominant-baseline="middle"')
      expect(svg).toContain('x="50%"')
      expect(svg).toContain('y="50%"')
    })

    it('handles very small dimensions (10x10)', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, height: 10, width: 10 })
      expect(svg).toContain('width="10"')
      expect(svg).toContain('height="10"')
      expect(svg).toContain('<text')
      expect(svg).toContain('font-size="10"')
    })

    it('handles very large dimensions (4000x4000)', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, height: 4000, width: 4000 })
      expect(svg).toContain('width="4000"')
      expect(svg).toContain('height="4000"')
      expect(svg).toContain('viewBox="0 0 4000 4000"')
    })

    it('handles 1x1 dimensions', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, height: 1, width: 1 })
      expect(svg).toContain('width="1"')
      expect(svg).toContain('height="1"')
      expect(svg).toContain('font-size="10"')
    })

    it('escapes special XML characters in text', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, text: '<script>&"test"</script>' })
      expect(svg).toContain('&lt;script&gt;&amp;&quot;test&quot;&lt;/script&gt;')
      expect(svg).not.toContain('<script>')
    })

    it('escapes special XML characters in colors', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, bgColor: '"red"' })
      expect(svg).toContain('fill="&quot;red&quot;"')
    })

    it('calculates font size based on smaller dimension', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, height: 200, width: 800 })
      expect(svg).toContain('font-size="25"')
    })

    it('shrinks font size for long text to prevent overflow', () => {
      const svg = generatePlaceholderSvg({ ...defaultOptions, height: 200, text: 'ABCDEFGHIJKLMNOP', width: 200 })
      const match = svg.match(/font-size="(\d+)"/)
      expect(match).not.toBeNull()
      const fontSize = Number(match![1])
      expect(fontSize).toBeLessThan(25)
      expect(fontSize).toBeGreaterThanOrEqual(10)
    })
  })

  describe('PLACEHOLDER_PRESETS', () => {
    it('contains expected preset entries', () => {
      const labels = PLACEHOLDER_PRESETS.map((p) => p.label)
      expect(labels).toContain('Thumbnail')
      expect(labels).toContain('Avatar')
      expect(labels).toContain('Banner')
      expect(labels).toContain('Hero')
    })

    it('has Thumbnail preset with 150x150 dimensions', () => {
      const thumbnail = PLACEHOLDER_PRESETS.find((p) => p.label === 'Thumbnail')
      expect(thumbnail).toEqual({ height: 150, label: 'Thumbnail', width: 150 })
    })

    it('has Banner preset with 1200x630 dimensions', () => {
      const banner = PLACEHOLDER_PRESETS.find((p) => p.label === 'Banner')
      expect(banner).toEqual({ height: 630, label: 'Banner', width: 1200 })
    })

    it('has Hero preset with 1920x1080 dimensions', () => {
      const hero = PLACEHOLDER_PRESETS.find((p) => p.label === 'Hero')
      expect(hero).toEqual({ height: 1080, label: 'Hero', width: 1920 })
    })

    it('has Card preset with 300x200 dimensions', () => {
      const card = PLACEHOLDER_PRESETS.find((p) => p.label === 'Card')
      expect(card).toEqual({ height: 200, label: 'Card', width: 300 })
    })

    it('has all presets with positive dimensions', () => {
      for (const preset of PLACEHOLDER_PRESETS) {
        expect(preset.width).toBeGreaterThan(0)
        expect(preset.height).toBeGreaterThan(0)
      }
    })
  })
})
