import { describe, expect, it } from 'vitest'

import { DEFAULT_PASSWORD_OPTIONS, generatePassword, SYMBOL_CHARS } from '@/utils/password'

describe('password utilities', () => {
  describe('generatePassword', () => {
    it('should generate a password with default length of 16', () => {
      const password = generatePassword(DEFAULT_PASSWORD_OPTIONS)
      expect(password).toHaveLength(16)
    })

    it('should respect custom length', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 32 })
      expect(password).toHaveLength(32)
    })

    it('should generate minimum length password (8)', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 8 })
      expect(password).toHaveLength(8)
    })

    it('should generate maximum length password (128)', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 128 })
      expect(password).toHaveLength(128)
    })

    it('should clamp length below minimum to 8', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 3 })
      expect(password).toHaveLength(8)
    })

    it('should clamp length above maximum to 128', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 200 })
      expect(password).toHaveLength(128)
    })

    it('should floor fractional length', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 20.7 })
      expect(password).toHaveLength(20)
    })

    it('should default NaN length to 16', () => {
      const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: NaN })
      expect(password).toHaveLength(16)
    })

    it('should generate uppercase-only when only uppercase enabled', () => {
      const password = generatePassword({
        digits: false,
        length: 32,
        lowercase: false,
        symbols: false,
        uppercase: true,
      })
      expect(password).toMatch(/^[A-Z]+$/)
    })

    it('should generate lowercase-only when only lowercase enabled', () => {
      const password = generatePassword({
        digits: false,
        length: 32,
        lowercase: true,
        symbols: false,
        uppercase: false,
      })
      expect(password).toMatch(/^[a-z]+$/)
    })

    it('should generate digits-only when only digits enabled', () => {
      const password = generatePassword({
        digits: true,
        length: 32,
        lowercase: false,
        symbols: false,
        uppercase: false,
      })
      expect(password).toMatch(/^[0-9]+$/)
    })

    it('should generate symbols-only when only symbols enabled', () => {
      const password = generatePassword({
        digits: false,
        length: 32,
        lowercase: false,
        symbols: true,
        uppercase: false,
      })
      for (const char of password) {
        expect(SYMBOL_CHARS).toContain(char)
      }
    })

    it('should contain at least 1 character of each enabled type with all types on', () => {
      for (let i = 0; i < 10; i++) {
        const password = generatePassword({ ...DEFAULT_PASSWORD_OPTIONS, length: 16 })
        expect(password).toMatch(/[A-Z]/)
        expect(password).toMatch(/[a-z]/)
        expect(password).toMatch(/[0-9]/)
        const hasSymbol = [...password].some((c) => SYMBOL_CHARS.includes(c))
        expect(hasSymbol).toBe(true)
      }
    })

    it('should fallback to lowercase when all character types are disabled', () => {
      const password = generatePassword({
        digits: false,
        length: 32,
        lowercase: false,
        symbols: false,
        uppercase: false,
      })
      expect(password).toMatch(/^[a-z]+$/)
      expect(password).toHaveLength(32)
    })

    it('should produce different passwords on consecutive calls', () => {
      const p1 = generatePassword(DEFAULT_PASSWORD_OPTIONS)
      const p2 = generatePassword(DEFAULT_PASSWORD_OPTIONS)
      expect(p1).not.toBe(p2)
    })
  })
})
