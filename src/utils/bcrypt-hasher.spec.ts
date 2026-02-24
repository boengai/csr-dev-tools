import { describe, expect, it } from 'vitest'

import {
  checkPasswordTruncation,
  hashPassword,
  isValidBcryptHash,
  parseBcryptHash,
  verifyPassword,
} from './bcrypt-hasher'

describe('bcrypt-hasher', () => {
  describe('hashPassword', () => {
    it('produces a valid bcrypt hash with default rounds (10)', async () => {
      const result = await hashPassword('testpassword', 10)
      expect(result.hash).toMatch(/^\$2b\$10\$.{53}$/)
      expect(result.hash).toHaveLength(60)
      expect(result.rounds).toBe(10)
    })

    it('produces a valid hash with custom rounds (4)', async () => {
      const result = await hashPassword('testpassword', 4)
      expect(result.hash).toMatch(/^\$2b\$04\$.{53}$/)
      expect(result.hash).toHaveLength(60)
      expect(result.rounds).toBe(4)
    })

    it('invokes the progress callback with values between 0.0 and 1.0', async () => {
      const progressValues: Array<number> = []
      await hashPassword('testpassword', 4, (percent) => {
        progressValues.push(percent)
      })
      expect(progressValues.length).toBeGreaterThan(0)
      for (const val of progressValues) {
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(1)
      }
    })

    it('tracks elapsed time (> 0)', async () => {
      const result = await hashPassword('testpassword', 4)
      expect(result.elapsed).toBeGreaterThan(0)
    })
  })

  describe('verifyPassword', () => {
    it('returns match: true for the correct password', async () => {
      const { hash } = await hashPassword('mypassword', 4)
      const result = await verifyPassword('mypassword', hash)
      expect(result.match).toBe(true)
    })

    it('returns match: false for the wrong password', async () => {
      const { hash } = await hashPassword('mypassword', 4)
      const result = await verifyPassword('wrongpassword', hash)
      expect(result.match).toBe(false)
    })
  })

  describe('isValidBcryptHash', () => {
    it('returns true for valid $2a$ hash', () => {
      expect(isValidBcryptHash('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(true)
    })

    it('returns true for valid $2b$ hash', () => {
      expect(isValidBcryptHash('$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(true)
    })

    it('returns true for valid $2y$ hash', () => {
      expect(isValidBcryptHash('$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(true)
    })

    it('returns false for random strings', () => {
      expect(isValidBcryptHash('notahash')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidBcryptHash('')).toBe(false)
    })

    it('returns false for partial hash (too short)', () => {
      expect(isValidBcryptHash('$2b$10$N9qo8uLO')).toBe(false)
    })

    it('returns false for invalid cost factor (00, 03, 32, 99)', () => {
      expect(isValidBcryptHash('$2b$00$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(false)
      expect(isValidBcryptHash('$2b$03$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(false)
      expect(isValidBcryptHash('$2b$32$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(false)
      expect(isValidBcryptHash('$2b$99$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')).toBe(false)
    })
  })

  describe('parseBcryptHash', () => {
    it('extracts version, rounds, and salt correctly', () => {
      const result = parseBcryptHash('$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
      expect(result.version).toBe('2b')
      expect(result.rounds).toBe(10)
      expect(result.salt).toBe('N9qo8uLOickgx2ZMRZoMye')
    })
  })

  describe('checkPasswordTruncation', () => {
    it('returns false for short passwords', () => {
      expect(checkPasswordTruncation('short')).toBe(false)
    })

    it('returns false for exactly 72 bytes', () => {
      expect(checkPasswordTruncation('a'.repeat(72))).toBe(false)
    })

    it('returns true for passwords exceeding 72 bytes', () => {
      expect(checkPasswordTruncation('a'.repeat(73))).toBe(true)
    })

    it('handles multi-byte UTF-8 characters correctly (emoji count as 4 bytes)', () => {
      // Each emoji is 4 bytes, so 19 emojis = 76 bytes > 72
      expect(checkPasswordTruncation('😀'.repeat(19))).toBe(true)
      // 18 emojis = 72 bytes, not exceeding
      expect(checkPasswordTruncation('😀'.repeat(18))).toBe(false)
    })
  })
})
