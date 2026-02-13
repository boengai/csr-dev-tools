import { describe, expect, it } from 'vitest'

import {
  isValidBase64,
  isValidHex,
  isValidHsl,
  isValidJson,
  isValidJwt,
  isValidRgb,
  isValidTimestamp,
  isValidUrl,
  isValidUuid,
} from '@/utils'

describe('validation utilities', () => {
  describe('isValidHex', () => {
    it('should return true for valid 6-digit hex with #', () => {
      expect(isValidHex('#3B82F6')).toBe(true)
    })

    it('should return true for valid 6-digit hex without #', () => {
      expect(isValidHex('3B82F6')).toBe(true)
    })

    it('should return true for lowercase hex', () => {
      expect(isValidHex('#3b82f6')).toBe(true)
    })

    it('should return true for 3-digit shorthand hex', () => {
      expect(isValidHex('#FFF')).toBe(true)
    })

    it('should return true for 3-digit shorthand without #', () => {
      expect(isValidHex('FFF')).toBe(true)
    })

    it('should return true for 8-digit hex with alpha', () => {
      expect(isValidHex('#3b82f6aa')).toBe(true)
    })

    it('should return true for 8-digit hex without #', () => {
      expect(isValidHex('3b82f6aa')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidHex('')).toBe(false)
    })

    it('should return false for invalid hex characters', () => {
      expect(isValidHex('#GGG')).toBe(false)
    })

    it('should return false for 2-digit hex', () => {
      expect(isValidHex('#12')).toBe(false)
    })

    it('should return false for random text', () => {
      expect(isValidHex('hello')).toBe(false)
    })

    it('should return false for 4-digit hex', () => {
      expect(isValidHex('#1234')).toBe(false)
    })

    it('should return false for 5-digit hex', () => {
      expect(isValidHex('#12345')).toBe(false)
    })

    it('should return false for 7-digit hex', () => {
      expect(isValidHex('#1234567')).toBe(false)
    })
  })

  describe('isValidRgb', () => {
    it('should return true for rgb(0, 0, 0)', () => {
      expect(isValidRgb('rgb(0, 0, 0)')).toBe(true)
    })

    it('should return true for rgb(255, 255, 255)', () => {
      expect(isValidRgb('rgb(255, 255, 255)')).toBe(true)
    })

    it('should return true for rgb with varied spacing', () => {
      expect(isValidRgb('rgb(59,  130,   246)')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidRgb('')).toBe(false)
    })

    it('should return false for value above 255', () => {
      expect(isValidRgb('rgb(256, 0, 0)')).toBe(false)
    })

    it('should return false for negative values', () => {
      expect(isValidRgb('rgb(-1, 0, 0)')).toBe(false)
    })

    it('should return false for only two values', () => {
      expect(isValidRgb('rgb(0, 0)')).toBe(false)
    })

    it('should return false for decimal values', () => {
      expect(isValidRgb('rgb(59.5, 130, 246)')).toBe(false)
    })

    it('should return true for boundary value 0', () => {
      expect(isValidRgb('rgb(0, 0, 0)')).toBe(true)
    })

    it('should return true for boundary value 255', () => {
      expect(isValidRgb('rgb(255, 255, 255)')).toBe(true)
    })

    it('should return false for random text', () => {
      expect(isValidRgb('hello')).toBe(false)
    })
  })

  describe('isValidHsl', () => {
    it('should return true for hsl(0, 0%, 0%)', () => {
      expect(isValidHsl('hsl(0, 0%, 0%)')).toBe(true)
    })

    it('should return true for hsl(360, 100%, 100%)', () => {
      expect(isValidHsl('hsl(360, 100%, 100%)')).toBe(true)
    })

    it('should return true for mid-range values', () => {
      expect(isValidHsl('hsl(180, 50%, 50%)')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidHsl('')).toBe(false)
    })

    it('should return false for hue above 360', () => {
      expect(isValidHsl('hsl(361, 0%, 0%)')).toBe(false)
    })

    it('should return false for saturation above 100', () => {
      expect(isValidHsl('hsl(0, 101%, 0%)')).toBe(false)
    })

    it('should return false for missing % sign', () => {
      expect(isValidHsl('hsl(0, 0, 0)')).toBe(false)
    })

    it('should return false for non-numeric values', () => {
      expect(isValidHsl('hsl(abc, 0%, 0%)')).toBe(false)
    })

    it('should return false for random text', () => {
      expect(isValidHsl('hello')).toBe(false)
    })

    it('should return true for boundary hue 0', () => {
      expect(isValidHsl('hsl(0, 50%, 50%)')).toBe(true)
    })

    it('should return true for boundary hue 360', () => {
      expect(isValidHsl('hsl(360, 50%, 50%)')).toBe(true)
    })
  })

  describe('isValidBase64', () => {
    it('should return true for valid base64 with padding', () => {
      expect(isValidBase64('SGVsbG8=')).toBe(true)
    })

    it('should return true for valid base64 with double padding', () => {
      expect(isValidBase64('dGVzdA==')).toBe(true)
    })

    it('should return true for valid base64 without padding', () => {
      expect(isValidBase64('Zm9v')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidBase64('')).toBe(false)
    })

    it('should return false for invalid characters', () => {
      expect(isValidBase64('!@#$')).toBe(false)
    })

    it('should return false for string with length not multiple of 4', () => {
      expect(isValidBase64('abc')).toBe(false)
    })

    it('should return true for longer valid base64', () => {
      expect(isValidBase64('SGVsbG8gV29ybGQ=')).toBe(true)
    })

    it('should return false for single character', () => {
      expect(isValidBase64('a')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('should return true for https URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
    })

    it('should return true for http URL', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true)
    })

    it('should return true for ftp URL', () => {
      expect(isValidUrl('ftp://files.example.com')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidUrl('')).toBe(false)
    })

    it('should return false for random text', () => {
      expect(isValidUrl('not a url')).toBe(false)
    })

    it('should return false for bare domain without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false)
    })

    it('should return true for URL with query string', () => {
      expect(isValidUrl('https://example.com/path?key=value')).toBe(true)
    })

    it('should return true for URL with fragment', () => {
      expect(isValidUrl('https://example.com/path#section')).toBe(true)
    })

    it('should return true for URL with unicode', () => {
      expect(isValidUrl('https://例え.jp/パス')).toBe(true)
    })
  })

  describe('isValidJson', () => {
    it('should return true for valid object', () => {
      expect(isValidJson('{"key":"value"}')).toBe(true)
    })

    it('should return true for valid array', () => {
      expect(isValidJson('[1,2,3]')).toBe(true)
    })

    it('should return true for valid string', () => {
      expect(isValidJson('"string"')).toBe(true)
    })

    it('should return true for null', () => {
      expect(isValidJson('null')).toBe(true)
    })

    it('should return true for number', () => {
      expect(isValidJson('123')).toBe(true)
    })

    it('should return true for boolean', () => {
      expect(isValidJson('true')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidJson('')).toBe(false)
    })

    it('should return false for unquoted keys', () => {
      expect(isValidJson('{key: value}')).toBe(false)
    })

    it('should return false for trailing comma', () => {
      expect(isValidJson('{"key":"value",}')).toBe(false)
    })

    it('should return false for single quotes', () => {
      expect(isValidJson("{'key':'value'}")).toBe(false)
    })

    it('should return true for nested objects', () => {
      expect(isValidJson('{"a":{"b":{"c":1}}}')).toBe(true)
    })

    it('should return true for empty object', () => {
      expect(isValidJson('{}')).toBe(true)
    })

    it('should return true for empty array', () => {
      expect(isValidJson('[]')).toBe(true)
    })

    it('should return false for whitespace-only string', () => {
      expect(isValidJson('   ')).toBe(false)
    })
  })

  describe('isValidJwt', () => {
    it('should return true for valid JWT format', () => {
      expect(
        isValidJwt('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'),
      ).toBe(true)
    })

    it('should return true for minimal valid JWT', () => {
      expect(isValidJwt('a.b.c')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidJwt('')).toBe(false)
    })

    it('should return false for 2 segments', () => {
      expect(isValidJwt('header.payload')).toBe(false)
    })

    it('should return false for 4 segments', () => {
      expect(isValidJwt('a.b.c.d')).toBe(false)
    })

    it('should return false for invalid base64url characters', () => {
      expect(isValidJwt('a!b.c.d')).toBe(false)
    })

    it('should return true for JWT with underscores and hyphens', () => {
      expect(isValidJwt('abc_def.ghi-jkl.mno_pqr')).toBe(true)
    })

    it('should return false for segments with padding characters', () => {
      expect(isValidJwt('abc=.def.ghi')).toBe(false)
    })
  })

  describe('isValidUuid', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should return true for uppercase UUID v4', () => {
      expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
    })

    it('should return true for variant digits 8, 9, a, b', () => {
      expect(isValidUuid('550e8400-e29b-41d4-8716-446655440000')).toBe(true)
      expect(isValidUuid('550e8400-e29b-41d4-9716-446655440000')).toBe(true)
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isValidUuid('550e8400-e29b-41d4-b716-446655440000')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidUuid('')).toBe(false)
    })

    it('should return false for wrong length', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false)
    })

    it('should return false for missing dashes', () => {
      expect(isValidUuid('550e8400e29b41d4a716446655440000')).toBe(false)
    })

    it('should return false for wrong version digit (not 4)', () => {
      expect(isValidUuid('550e8400-e29b-31d4-a716-446655440000')).toBe(false)
    })

    it('should return false for wrong variant digit', () => {
      expect(isValidUuid('550e8400-e29b-41d4-c716-446655440000')).toBe(false)
    })

    it('should return false for random text', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false)
    })
  })

  describe('isValidTimestamp', () => {
    it('should return true for 0', () => {
      expect(isValidTimestamp('0')).toBe(true)
    })

    it('should return true for typical Unix timestamp', () => {
      expect(isValidTimestamp('1700000000')).toBe(true)
    })

    it('should return true for millisecond timestamp', () => {
      expect(isValidTimestamp('1700000000000')).toBe(true)
    })

    it('should return true for max allowed value', () => {
      expect(isValidTimestamp('4398046511103')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidTimestamp('')).toBe(false)
    })

    it('should return false for NaN', () => {
      expect(isValidTimestamp('NaN')).toBe(false)
    })

    it('should return false for negative number', () => {
      expect(isValidTimestamp('-1')).toBe(false)
    })

    it('should return false for non-numeric string', () => {
      expect(isValidTimestamp('abc')).toBe(false)
    })

    it('should return false for float', () => {
      expect(isValidTimestamp('1700000000.5')).toBe(false)
    })

    it('should return false for Infinity', () => {
      expect(isValidTimestamp('Infinity')).toBe(false)
    })

    it('should return false for value above max', () => {
      expect(isValidTimestamp('4398046511104')).toBe(false)
    })

    it('should return false for whitespace-only string', () => {
      expect(isValidTimestamp('   ')).toBe(false)
    })

    it('should return false for hex notation', () => {
      expect(isValidTimestamp('0xFF')).toBe(false)
    })

    it('should return false for scientific notation', () => {
      expect(isValidTimestamp('1e10')).toBe(false)
    })

    it('should return false for octal notation', () => {
      expect(isValidTimestamp('0o17')).toBe(false)
    })

    it('should return false for binary notation', () => {
      expect(isValidTimestamp('0b1010')).toBe(false)
    })

    it('should return false for whitespace-padded number', () => {
      expect(isValidTimestamp('  42  ')).toBe(false)
    })
  })
})
