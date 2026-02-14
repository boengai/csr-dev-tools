import { describe, expect, it } from 'vitest'

import { parseDataUrlToBlob, parseFileName } from '@/utils/file'
import { calculateDimensions, getSafeImageFormat, isValidImageFormat, validateCoordinates } from '@/utils/image'

describe('image utilities', () => {
  describe('isValidImageFormat', () => {
    it('returns true for "image/png"', () => {
      expect(isValidImageFormat('image/png')).toBe(true)
    })

    it('returns true for "image/jpeg"', () => {
      expect(isValidImageFormat('image/jpeg')).toBe(true)
    })

    it('returns true for "image/webp"', () => {
      expect(isValidImageFormat('image/webp')).toBe(true)
    })

    it('returns true for "image/gif"', () => {
      expect(isValidImageFormat('image/gif')).toBe(true)
    })

    it('returns true for "image/bmp"', () => {
      expect(isValidImageFormat('image/bmp')).toBe(true)
    })

    it('returns true for "image/avif"', () => {
      expect(isValidImageFormat('image/avif')).toBe(true)
    })

    it('returns false for "text/plain"', () => {
      expect(isValidImageFormat('text/plain')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidImageFormat('')).toBe(false)
    })

    it('returns false for "png" (missing mime prefix)', () => {
      expect(isValidImageFormat('png')).toBe(false)
    })

    it('returns false for "image/svg+xml"', () => {
      expect(isValidImageFormat('image/svg+xml')).toBe(false)
    })
  })

  describe('getSafeImageFormat', () => {
    it('returns the input for a valid format "image/png"', () => {
      expect(getSafeImageFormat('image/png')).toBe('image/png')
    })

    it('returns the input for a valid format "image/webp"', () => {
      expect(getSafeImageFormat('image/webp')).toBe('image/webp')
    })

    it('returns the input for a valid format "image/avif"', () => {
      expect(getSafeImageFormat('image/avif')).toBe('image/avif')
    })

    it('returns default fallback "image/jpeg" for undefined', () => {
      expect(getSafeImageFormat(undefined)).toBe('image/jpeg')
    })

    it('returns default fallback "image/jpeg" for invalid string', () => {
      expect(getSafeImageFormat('text/plain')).toBe('image/jpeg')
    })

    it('returns custom fallback for invalid format', () => {
      expect(getSafeImageFormat('invalid', 'image/png')).toBe('image/png')
    })

    it('returns default fallback for empty string', () => {
      expect(getSafeImageFormat('')).toBe('image/jpeg')
    })
  })

  describe('calculateDimensions', () => {
    describe('contain strategy', () => {
      it('preserves aspect ratio for landscape image', () => {
        const result = calculateDimensions({ height: 600, width: 1200 }, { height: 300, width: 600 }, 'contain')
        expect(result.canvas.width).toBeLessThanOrEqual(600)
        expect(result.canvas.height).toBeLessThanOrEqual(300)
      })

      it('preserves aspect ratio for portrait image', () => {
        const result = calculateDimensions({ height: 1200, width: 600 }, { height: 600, width: 300 }, 'contain')
        expect(result.canvas.width).toBeLessThanOrEqual(300)
        expect(result.canvas.height).toBeLessThanOrEqual(600)
      })

      it('preserves aspect ratio for square image', () => {
        const result = calculateDimensions({ height: 800, width: 800 }, { height: 400, width: 400 }, 'contain')
        expect(result.canvas.width).toBeLessThanOrEqual(400)
        expect(result.canvas.height).toBeLessThanOrEqual(400)
      })

      it('does not upscale when source fits within target', () => {
        const result = calculateDimensions({ height: 200, width: 200 }, { height: 400, width: 400 }, 'contain')
        expect(result.canvas.width).toBeLessThanOrEqual(400)
        expect(result.canvas.height).toBeLessThanOrEqual(400)
      })

      it('scales down a wide image that exceeds target width', () => {
        const result = calculateDimensions({ height: 500, width: 2000 }, { height: 500, width: 1000 }, 'contain')
        expect(result.canvas.width).toBeLessThanOrEqual(1000)
        expect(result.canvas.height).toBeLessThanOrEqual(500)
        // Aspect ratio preserved: 2000/500 = 4:1
        expect(result.canvas.width / result.canvas.height).toBeCloseTo(4, 0)
      })
    })

    describe('cover strategy', () => {
      it('fills target dimensions for landscape image', () => {
        const result = calculateDimensions({ height: 600, width: 1200 }, { height: 300, width: 300 }, 'cover')
        expect(result.canvas.width).toBe(300)
        expect(result.canvas.height).toBe(300)
      })

      it('fills target dimensions for portrait image', () => {
        const result = calculateDimensions({ height: 1200, width: 600 }, { height: 300, width: 300 }, 'cover')
        expect(result.canvas.width).toBe(300)
        expect(result.canvas.height).toBe(300)
      })

      it('crops source appropriately for aspect ratio mismatch', () => {
        const result = calculateDimensions({ height: 600, width: 1200 }, { height: 400, width: 400 }, 'cover')
        expect(result.canvas.width).toBe(400)
        expect(result.canvas.height).toBe(400)
        // Source should be cropped
        expect(result.source.width).toBeLessThanOrEqual(1200)
      })
    })

    describe('stretch strategy', () => {
      it('uses target dimensions directly', () => {
        const result = calculateDimensions({ height: 600, width: 1200 }, { height: 300, width: 300 }, 'stretch')
        expect(result.canvas.width).toBe(300)
        expect(result.canvas.height).toBe(300)
      })

      it('ignores aspect ratio', () => {
        const result = calculateDimensions({ height: 100, width: 500 }, { height: 200, width: 200 }, 'stretch')
        expect(result.canvas.width).toBe(200)
        expect(result.canvas.height).toBe(200)
        expect(result.source.width).toBe(500)
        expect(result.source.height).toBe(100)
      })
    })

    describe('edge cases', () => {
      it('throws for zero source width', () => {
        expect(() => calculateDimensions({ height: 600, width: 0 }, { height: 300, width: 300 }, 'contain')).toThrow(
          'Invalid dimensions',
        )
      })

      it('throws for zero source height', () => {
        expect(() => calculateDimensions({ height: 0, width: 600 }, { height: 300, width: 300 }, 'contain')).toThrow(
          'Invalid dimensions',
        )
      })

      it('throws for zero target width', () => {
        expect(() => calculateDimensions({ height: 600, width: 600 }, { height: 300, width: 0 }, 'contain')).toThrow(
          'Invalid dimensions',
        )
      })

      it('throws for zero target height', () => {
        expect(() => calculateDimensions({ height: 600, width: 600 }, { height: 0, width: 300 }, 'contain')).toThrow(
          'Invalid dimensions',
        )
      })

      it('handles very large dimensions without error', () => {
        const result = calculateDimensions({ height: 50000, width: 50000 }, { height: 1000, width: 1000 }, 'contain')
        expect(result.canvas.width).toBeLessThanOrEqual(1000)
        expect(result.canvas.height).toBeLessThanOrEqual(1000)
      })
    })
  })

  describe('parseFileName', () => {
    it('generates a filename with csr-dev-tools prefix', () => {
      const result = parseFileName('photo.png')
      expect(result).toMatch(/^csr-dev-tools_/)
    })

    it('uses the original extension when no format specified', () => {
      const result = parseFileName('photo.png')
      expect(result).toMatch(/\.png$/)
    })

    it('uses the target format extension when format specified', () => {
      const result = parseFileName('photo.png', 'image/jpeg')
      expect(result).toMatch(/\.jpg$/)
    })

    it('uses avif extension for image/avif format', () => {
      const result = parseFileName('photo.png', 'image/avif')
      expect(result).toMatch(/\.avif$/)
    })

    it('uses gif extension for image/gif format', () => {
      const result = parseFileName('photo.png', 'image/gif')
      expect(result).toMatch(/\.gif$/)
    })

    it('uses bmp extension for image/bmp format', () => {
      const result = parseFileName('photo.png', 'image/bmp')
      expect(result).toMatch(/\.bmp$/)
    })

    it('replaces special characters with underscores', () => {
      const result = parseFileName('my photo (1).png')
      expect(result).not.toMatch(/\s/)
      expect(result).not.toMatch(/[()]/)
    })

    it('includes a timestamp in the filename', () => {
      const before = Date.now()
      const result = parseFileName('photo.png')
      const after = Date.now()
      const timestampMatch = result.match(/_(\d+)\./)
      expect(timestampMatch).not.toBeNull()
      const timestamp = Number(timestampMatch![1])
      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('parseDataUrlToBlob', () => {
    it('returns a Blob for a valid data URL', async () => {
      const dataUrl = 'data:text/plain;base64,SGVsbG8='
      const blob = await parseDataUrlToBlob(dataUrl)
      expect(blob).toBeInstanceOf(Blob)
    })

    it('returns a Blob with correct content', async () => {
      const dataUrl = 'data:text/plain;base64,SGVsbG8='
      const blob = await parseDataUrlToBlob(dataUrl)
      const text = await blob.text()
      expect(text).toBe('Hello')
    })
  })

  describe('validateCoordinates', () => {
    it('passes valid coordinates through unchanged', () => {
      const result = validateCoordinates(10, 20, 100, 100, 500, 500)
      expect(result.x).toBe(10)
      expect(result.y).toBe(20)
      expect(result.width).toBe(100)
      expect(result.height).toBe(100)
    })

    it('clamps negative x to 0', () => {
      const result = validateCoordinates(-10, 20, 100, 100, 500, 500)
      expect(result.x).toBe(0)
    })

    it('clamps negative y to 0', () => {
      const result = validateCoordinates(10, -20, 100, 100, 500, 500)
      expect(result.y).toBe(0)
    })

    it('clamps x when it would overflow', () => {
      const result = validateCoordinates(450, 0, 100, 100, 500, 500)
      expect(result.x).toBeLessThanOrEqual(400)
      expect(result.x + result.width).toBeLessThanOrEqual(500)
    })

    it('clamps y when it would overflow', () => {
      const result = validateCoordinates(0, 450, 100, 100, 500, 500)
      expect(result.y).toBeLessThanOrEqual(400)
      expect(result.y + result.height).toBeLessThanOrEqual(500)
    })

    it('clamps width when it exceeds available space', () => {
      const result = validateCoordinates(0, 0, 600, 100, 500, 500)
      expect(result.width).toBeLessThanOrEqual(500)
    })

    it('clamps height when it exceeds available space', () => {
      const result = validateCoordinates(0, 0, 100, 600, 500, 500)
      expect(result.height).toBeLessThanOrEqual(500)
    })

    it('ensures minimum width of 1', () => {
      const result = validateCoordinates(499, 0, 0, 100, 500, 500)
      expect(result.width).toBeGreaterThanOrEqual(1)
    })

    it('ensures minimum height of 1', () => {
      const result = validateCoordinates(0, 499, 100, 0, 500, 500)
      expect(result.height).toBeGreaterThanOrEqual(1)
    })
  })
})
