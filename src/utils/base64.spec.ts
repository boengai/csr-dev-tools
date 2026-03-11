import { describe, expect, it } from 'vitest'

import { decodeBase64, encodeBase64 } from '@/utils'

describe('base64', () => {
  describe('encodeBase64', () => {
    it('encodes ASCII text ("Hello, World!" → "SGVsbG8sIFdvcmxkIQ==")', () => {
      expect(encodeBase64('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==')
    })

    it('encodes Unicode text ("こんにちは" → "44GT44KT44Gr44Gh44Gv")', () => {
      expect(encodeBase64('こんにちは')).toBe('44GT44KT44Gr44Gh44Gv')
    })

    it('encodes emoji ("🚀" → "8J+agA==")', () => {
      expect(encodeBase64('🚀')).toBe('8J+agA==')
    })

    it('encodes empty string → empty string (no error)', () => {
      expect(encodeBase64('')).toBe('')
    })

    it('encodes whitespace-only string → Base64 of whitespace', () => {
      const result = encodeBase64('   ')
      expect(result).toBe(btoa('   '))
    })

    it('encodes special characters (<>&"\' etc.)', () => {
      const input = '<>&"\'\n\t'
      const result = encodeBase64(input)
      expect(decodeBase64(result)).toBe(input)
    })

    it('encodes large string (10KB+) without error', () => {
      const large = 'a'.repeat(10240)
      const result = encodeBase64(large)
      expect(result).toBeTruthy()
      expect(decodeBase64(result)).toBe(large)
    })
  })

  describe('decodeBase64', () => {
    it('decodes valid Base64 with single padding ("SGVsbG8=" → "Hello")', () => {
      expect(decodeBase64('SGVsbG8=')).toBe('Hello')
    })

    it('decodes valid Base64 with double padding ("dGVzdA==" → "test")', () => {
      expect(decodeBase64('dGVzdA==')).toBe('test')
    })

    it('decodes valid Base64 without padding ("Zm9v" → "foo")', () => {
      expect(decodeBase64('Zm9v')).toBe('foo')
    })

    it('round-trips Unicode ("こんにちは" → encode → decode → exact match)', () => {
      const original = 'こんにちは'
      const encoded = encodeBase64(original)
      expect(decodeBase64(encoded)).toBe(original)
    })

    it('round-trips emoji ("🚀" → encode → decode → exact match)', () => {
      const original = '🚀'
      const encoded = encodeBase64(original)
      expect(decodeBase64(encoded)).toBe(original)
    })

    it('throws on invalid Base64 characters', () => {
      expect(() => decodeBase64('!@#$')).toThrow()
    })

    it('throws on malformed padding', () => {
      expect(() => decodeBase64('===')).toThrow()
    })

    it('handles whitespace in Base64 string gracefully (atob strips spaces)', () => {
      // Node atob is lenient with whitespace; component-level isValidBase64 rejects it
      expect(decodeBase64('SGVs bG8=')).toBe('Hello')
    })
  })

  describe('round-trip', () => {
    it.each([
      ['ASCII', 'Hello, World!'],
      ['Unicode', 'こんにちは'],
      ['emoji', '🚀🎉'],
      ['special chars', '<>&"\'\n\t'],
    ])('encode then decode === original for %s', (_label: string, input: string) => {
      expect(decodeBase64(encodeBase64(input))).toBe(input)
    })
  })
})
