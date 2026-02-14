import { describe, expect, it } from 'vitest'

import { decodeUrl, encodeUrl } from '@/utils/url'

describe('url encoding utilities', () => {
  describe('encodeUrl', () => {
    it('should encode spaces as %20', () => {
      expect(encodeUrl('hello world')).toBe('hello%20world')
    })

    it('should encode ampersand', () => {
      expect(encodeUrl('a&b')).toBe('a%26b')
    })

    it('should encode equals sign', () => {
      expect(encodeUrl('a=b')).toBe('a%3Db')
    })

    it('should encode question mark', () => {
      expect(encodeUrl('a?b')).toBe('a%3Fb')
    })

    it('should encode hash', () => {
      expect(encodeUrl('a#b')).toBe('a%23b')
    })

    it('should encode at sign', () => {
      expect(encodeUrl('a@b')).toBe('a%40b')
    })

    it('should encode plus sign', () => {
      expect(encodeUrl('a+b')).toBe('a%2Bb')
    })

    it('should encode forward slash', () => {
      expect(encodeUrl('a/b')).toBe('a%2Fb')
    })

    it('should preserve exclamation mark', () => {
      expect(encodeUrl('a!b')).toBe('a!b')
    })

    it('should return empty string for empty input', () => {
      expect(encodeUrl('')).toBe('')
    })

    it('should not double-encode already-encoded input', () => {
      expect(encodeUrl('hello%20world')).toBe('hello%2520world')
    })

    it('should encode Unicode characters', () => {
      expect(encodeUrl('日本語')).toBe('%E6%97%A5%E6%9C%AC%E8%AA%9E')
    })

    it('should preserve unreserved characters', () => {
      expect(encodeUrl('abc123-_.~')).toBe('abc123-_.~')
    })

    it('should encode complex query string', () => {
      expect(encodeUrl('key=val&key2=val 2')).toBe('key%3Dval%26key2%3Dval%202')
    })
  })

  describe('decodeUrl', () => {
    it('should decode %20 to space', () => {
      expect(decodeUrl('hello%20world')).toBe('hello world')
    })

    it('should decode %26 to ampersand', () => {
      expect(decodeUrl('a%26b')).toBe('a&b')
    })

    it('should decode multiple encoded characters', () => {
      expect(decodeUrl('hello%20world%26foo%3Dbar')).toBe('hello world&foo=bar')
    })

    it('should return empty string for empty input', () => {
      expect(decodeUrl('')).toBe('')
    })

    it('should decode Unicode characters', () => {
      expect(decodeUrl('%E6%97%A5%E6%9C%AC%E8%AA%9E')).toBe('日本語')
    })

    it('should pass through unencoded text', () => {
      expect(decodeUrl('hello')).toBe('hello')
    })

    it('should decode plus sign literally', () => {
      expect(decodeUrl('hello+world')).toBe('hello+world')
    })

    it('should decode full URL path', () => {
      expect(decodeUrl('%2Fpath%2Fto%2Fresource')).toBe('/path/to/resource')
    })

    it('should throw for invalid sequence %ZZ', () => {
      expect(() => decodeUrl('%ZZ')).toThrow()
    })

    it('should throw for truncated percent', () => {
      expect(() => decodeUrl('%')).toThrow()
    })

    it('should throw for single hex digit %A', () => {
      expect(() => decodeUrl('test%A')).toThrow()
    })
  })
})
