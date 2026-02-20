// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FaviconResult } from './favicon'

import { FAVICON_SIZES, generateFaviconLinkTags, generateFavicons, downloadFaviconsAsZip } from './favicon'

const createMockCanvas = () => {
  const ctx = {
    drawImage: vi.fn(),
  }
  return {
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((cb: (blob: Blob | null) => void) => cb(new Blob(['test'], { type: 'image/png' }))),
    toDataURL: vi.fn(() => 'data:image/png;base64,mockdata'),
    width: 0,
    height: 0,
  }
}

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

  describe('generateFavicons', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('produces one result per size', async () => {
      const mockCanvas = createMockCanvas()
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement)

      const img = new Image()
      const sizes = FAVICON_SIZES.slice(0, 2)
      const results = await generateFavicons(img, sizes)

      expect(results).toHaveLength(2)
      expect(results[0].size).toBe(sizes[0])
      expect(results[1].size).toBe(sizes[1])
    })

    it('returns valid blobs and data URLs', async () => {
      const mockCanvas = createMockCanvas()
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement)

      const img = new Image()
      const sizes = [FAVICON_SIZES[0]]
      const results = await generateFavicons(img, sizes)

      expect(results[0].blob).toBeInstanceOf(Blob)
      expect(results[0].dataUrl).toBe('data:image/png;base64,mockdata')
    })
  })

  describe('downloadFaviconsAsZip', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('triggers download with correct filename', async () => {
      const mockClick = vi.fn()
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement)

      const mockUrl = 'blob:mock'
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl)
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const mockResults: Array<FaviconResult> = [
        {
          blob: new Blob(['test'], { type: 'image/png' }),
          dataUrl: 'data:image/png;base64,test',
          size: FAVICON_SIZES[0],
        },
      ]

      await downloadFaviconsAsZip(mockResults)

      expect(mockClick).toHaveBeenCalledOnce()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
    })
  })
})
