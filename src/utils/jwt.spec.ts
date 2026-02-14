import { describe, expect, it } from 'vitest'

import { decodeJwt, formatPayloadWithTimestamps, formatTimestampClaim } from '@/utils/jwt'

describe('jwt decoding utilities', () => {
  // Standard test JWT: {"alg":"HS256","typ":"JWT"}.{"sub":"1234567890","name":"John Doe","iat":1516239022}
  const VALID_JWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  describe('decodeJwt', () => {
    it('should decode a valid JWT header', () => {
      const result = decodeJwt(VALID_JWT)
      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    })

    it('should decode a valid JWT payload', () => {
      const result = decodeJwt(VALID_JWT)
      expect(result.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 })
    })

    it('should return signature as raw Base64URL string', () => {
      const result = decodeJwt(VALID_JWT)
      expect(result.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    })

    it('should decode JWT with RS256 algorithm', () => {
      // Header: {"alg":"RS256","typ":"JWT"} -> eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
      // Payload: {"sub":"rs256-test"} -> eyJzdWIiOiJyczI1Ni10ZXN0In0
      const rs256Jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyczI1Ni10ZXN0In0.fake-signature'
      const result = decodeJwt(rs256Jwt)
      expect(result.header).toEqual({ alg: 'RS256', typ: 'JWT' })
      expect(result.payload).toEqual({ sub: 'rs256-test' })
    })

    it('should decode JWT with exp, iat, and nbf claims', () => {
      // Header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
      // Payload: {"exp":1700000000,"iat":1516239022,"nbf":1516239000} -> eyJleHAiOjE3MDAwMDAwMDAsImlhdCI6MTUxNjIzOTAyMiwibmJmIjoxNTE2MjM5MDAwfQ
      const jwtWithTimestamps =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDAwMDAwMDAsImlhdCI6MTUxNjIzOTAyMiwibmJmIjoxNTE2MjM5MDAwfQ.test-sig'
      const result = decodeJwt(jwtWithTimestamps)
      expect(result.payload).toHaveProperty('exp', 1700000000)
      expect(result.payload).toHaveProperty('iat', 1516239022)
      expect(result.payload).toHaveProperty('nbf', 1516239000)
    })

    it('should throw for empty string', () => {
      expect(() => decodeJwt('')).toThrow()
    })

    it('should throw for 2-segment input', () => {
      expect(() => decodeJwt('header.payload')).toThrow()
    })

    it('should throw for 4-segment input', () => {
      expect(() => decodeJwt('a.b.c.d')).toThrow()
    })

    it('should throw for invalid Base64URL characters in header', () => {
      expect(() => decodeJwt('!!!.eyJ0ZXN0IjoxfQ.sig')).toThrow()
    })

    it('should throw for malformed JSON in header', () => {
      // "not json" -> bm90IGpzb24
      expect(() => decodeJwt('bm90IGpzb24.eyJ0ZXN0IjoxfQ.sig')).toThrow()
    })

    it('should throw for malformed JSON in payload', () => {
      // Valid header, but payload is "not json" -> bm90IGpzb24
      expect(() => decodeJwt('eyJhbGciOiJIUzI1NiJ9.bm90IGpzb24.sig')).toThrow()
    })

    it('should throw for non-object header (array)', () => {
      // [] -> W10
      expect(() => decodeJwt('W10.eyJ0ZXN0IjoxfQ.sig')).toThrow()
    })

    it('should throw for non-object payload (number)', () => {
      // 42 -> NDI
      expect(() => decodeJwt('eyJhbGciOiJIUzI1NiJ9.NDI.sig')).toThrow()
    })
  })

  describe('formatTimestampClaim', () => {
    it('should convert Unix seconds to human-readable date string', () => {
      const result = formatTimestampClaim(1516239022)
      expect(result).toContain('2018')
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })

    it('should handle epoch 0', () => {
      const result = formatTimestampClaim(0)
      expect(result).toContain('1970')
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('formatPayloadWithTimestamps', () => {
    it('should return plain JSON when no timestamp claims exist', () => {
      const payload = { sub: '1234567890', name: 'John Doe' }
      const result = formatPayloadWithTimestamps(payload)
      expect(result).toBe(JSON.stringify(payload, null, 2))
    })

    it('should annotate iat claim with human-readable date', () => {
      const payload = { sub: '1234567890', iat: 1516239022 }
      const result = formatPayloadWithTimestamps(payload)
      expect(result).toContain('"iat": 1516239022  //')
      expect(result).toContain('2018')
    })

    it('should annotate all timestamp claims (exp, iat, nbf)', () => {
      const payload = { exp: 1700000000, iat: 1516239022, nbf: 1516239000 }
      const result = formatPayloadWithTimestamps(payload)
      const lines = result.split('\n')
      const annotatedLines = lines.filter((line) => line.includes('//'))
      expect(annotatedLines).toHaveLength(3)
    })

    it('should not annotate non-numeric timestamp claims', () => {
      const payload = { exp: 'not-a-number', iat: 1516239022 }
      const result = formatPayloadWithTimestamps(payload)
      const lines = result.split('\n')
      const annotatedLines = lines.filter((line) => line.includes('//'))
      expect(annotatedLines).toHaveLength(1)
      expect(result).not.toContain('"exp": "not-a-number"  //')
    })

    it('should not annotate nested properties with timestamp claim names', () => {
      const payload = { data: { exp: 42 }, exp: 1700000000 }
      const result = formatPayloadWithTimestamps(payload)
      const lines = result.split('\n')
      const annotatedLines = lines.filter((line) => line.includes('//'))
      expect(annotatedLines).toHaveLength(1)
      expect(result).toContain('"exp": 1700000000  //')
    })
  })
})
