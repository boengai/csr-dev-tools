import { describe, expect, it } from 'vitest'

import { decodeHtmlEntities, encodeHtmlEntities } from '@/utils/html-entity'

describe('html entity utilities', () => {
  describe('encodeHtmlEntities', () => {
    it('should encode special characters to named entities', () => {
      expect(encodeHtmlEntities('<div>')).toBe('&lt;div&gt;')
    })

    it('should encode ampersand', () => {
      expect(encodeHtmlEntities('a & b')).toBe('a &amp; b')
    })

    it('should encode quotes', () => {
      expect(encodeHtmlEntities('"hello"')).toBe('&quot;hello&quot;')
    })

    it('should encode copyright symbol with named mode', () => {
      expect(encodeHtmlEntities('©', 'named')).toBe('&copy;')
    })

    it('should encode to numeric entities', () => {
      expect(encodeHtmlEntities('<', 'numeric')).toBe('&#60;')
    })

    it('should encode copyright as numeric', () => {
      expect(encodeHtmlEntities('©', 'numeric')).toBe('&#169;')
    })

    it('should leave plain text unchanged', () => {
      expect(encodeHtmlEntities('hello world')).toBe('hello world')
    })

    it('should throw on empty input', () => {
      expect(() => encodeHtmlEntities('')).toThrow('Empty input')
    })
  })

  describe('decodeHtmlEntities', () => {
    it('should decode named entities', () => {
      expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>')
    })

    it('should decode numeric entities', () => {
      expect(decodeHtmlEntities('&#60;div&#62;')).toBe('<div>')
    })

    it('should decode hex entities', () => {
      expect(decodeHtmlEntities('&#x3C;div&#x3E;')).toBe('<div>')
    })

    it('should decode mixed entities', () => {
      expect(decodeHtmlEntities('&amp; &#60; &copy;')).toBe('& < ©')
    })

    it('should leave plain text unchanged', () => {
      expect(decodeHtmlEntities('hello world')).toBe('hello world')
    })

    it('should throw on empty input', () => {
      expect(() => decodeHtmlEntities('')).toThrow('Empty input')
    })
  })
})
