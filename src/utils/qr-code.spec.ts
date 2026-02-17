import { describe, expect, it } from 'vitest'

import { generateQrCodeDataUrl, generateQrCodeSvgString } from './qr-code'

describe('qr-code', () => {
  describe('generateQrCodeDataUrl', () => {
    it('returns a data URL for valid text', async () => {
      const result = await generateQrCodeDataUrl('hello')
      expect(result).toMatch(/^data:image\/png;base64,/)
    })

    it('respects size option', async () => {
      const result = await generateQrCodeDataUrl('hello', { size: 128 })
      expect(result).toMatch(/^data:image\/png;base64,/)
    })

    it('throws for empty text', async () => {
      await expect(generateQrCodeDataUrl('')).rejects.toThrow()
    })
  })

  describe('generateQrCodeSvgString', () => {
    it('returns an SVG string', async () => {
      const result = await generateQrCodeSvgString('hello')
      expect(result).toContain('<svg')
      expect(result).toContain('</svg>')
    })
  })
})
