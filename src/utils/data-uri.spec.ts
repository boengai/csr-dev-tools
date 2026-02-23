import { describe, expect, it } from 'vitest'

import {
  SIZE_WARNING_THRESHOLD,
  isCssCompatibleMimeType,
  isImageMimeType,
  isValidDataUri,
  parseDataUri,
} from './data-uri'

describe('data-uri', () => {
  describe('parseDataUri', () => {
    it('parses a valid image data URI correctly', () => {
      const uri = 'data:image/png;base64,iVBORw0KGgo='
      const result = parseDataUri(uri)

      expect(result.mimeType).toBe('image/png')
      expect(result.encoding).toBe('base64')
      expect(result.isImage).toBe(true)
      expect(result.previewUri).toBe(uri)
      expect(result.decodedSize).toBeGreaterThan(0)
      expect(result.data).toBe('iVBORw0KGgo=')
    })

    it('parses a valid font data URI with isImage=false and previewUri null', () => {
      const uri = 'data:font/woff2;base64,d09GMgA='
      const result = parseDataUri(uri)

      expect(result.mimeType).toBe('font/woff2')
      expect(result.encoding).toBe('base64')
      expect(result.isImage).toBe(false)
      expect(result.previewUri).toBeNull()
    })

    it('parses a valid text/plain data URI correctly', () => {
      const uri = 'data:text/plain;base64,SGVsbG8='
      const result = parseDataUri(uri)

      expect(result.mimeType).toBe('text/plain')
      expect(result.encoding).toBe('base64')
      expect(result.isImage).toBe(false)
      expect(result.previewUri).toBeNull()
      expect(result.data).toBe('SGVsbG8=')
    })

    it('throws Error for input without data: prefix', () => {
      expect(() => parseDataUri('not-a-data-uri')).toThrow('Invalid data URI format')
    })

    it('throws Error for malformed URI missing semicolon or comma', () => {
      expect(() => parseDataUri('data:image/pngbase64abc')).toThrow('Invalid data URI format')
      expect(() => parseDataUri('data:image/png;base64')).toThrow('Invalid data URI format')
    })

    it('calculates decoded size correctly accounting for base64 padding', () => {
      // "a" = 1 byte, base64 = "YQ==" (2 padding chars)
      expect(parseDataUri('data:text/plain;base64,YQ==').decodedSize).toBe(1)
      // "Hello" = 5 bytes, base64 = "SGVsbG8=" (1 padding char)
      expect(parseDataUri('data:text/plain;base64,SGVsbG8=').decodedSize).toBe(5)
      // "abc" = 3 bytes, base64 = "YWJj" (no padding)
      expect(parseDataUri('data:text/plain;base64,YWJj').decodedSize).toBe(3)
    })
  })

  describe('isImageMimeType', () => {
    it('returns true for image/png, image/jpeg, image/svg+xml', () => {
      expect(isImageMimeType('image/png')).toBe(true)
      expect(isImageMimeType('image/jpeg')).toBe(true)
      expect(isImageMimeType('image/svg+xml')).toBe(true)
    })

    it('returns false for font/woff2, text/plain', () => {
      expect(isImageMimeType('font/woff2')).toBe(false)
      expect(isImageMimeType('text/plain')).toBe(false)
    })
  })

  describe('isCssCompatibleMimeType', () => {
    it('returns true for image/png and font/woff2', () => {
      expect(isCssCompatibleMimeType('image/png')).toBe(true)
      expect(isCssCompatibleMimeType('font/woff2')).toBe(true)
    })

    it('returns false for text/plain and application/json', () => {
      expect(isCssCompatibleMimeType('text/plain')).toBe(false)
      expect(isCssCompatibleMimeType('application/json')).toBe(false)
    })
  })

  describe('isValidDataUri', () => {
    it('returns true for valid data URIs', () => {
      expect(isValidDataUri('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
      expect(isValidDataUri('data:text/plain;charset=utf-8,Hello')).toBe(true)
    })

    it('returns false for plain strings and partial matches', () => {
      expect(isValidDataUri('hello world')).toBe(false)
      expect(isValidDataUri('data:')).toBe(false)
      expect(isValidDataUri('')).toBe(false)
    })
  })

  describe('SIZE_WARNING_THRESHOLD', () => {
    it('equals 30720 (30 * 1024)', () => {
      expect(SIZE_WARNING_THRESHOLD).toBe(30720)
    })
  })
})
