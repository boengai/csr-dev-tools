import { describe, expect, it } from 'vitest'

import { computeHash, DEFAULT_HASH_ALGORITHM, HASH_ALGORITHMS } from '@/utils/hash'

describe('hash utilities', () => {
  describe('computeHash', () => {
    it('should compute MD5 of empty string', async () => {
      const hash = await computeHash('', 'MD5')
      expect(hash).toBe('d41d8cd98f00b204e9800998ecf8427e')
    })

    it('should compute SHA-1 of empty string', async () => {
      const hash = await computeHash('', 'SHA-1')
      expect(hash).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709')
    })

    it('should compute SHA-256 of empty string', async () => {
      const hash = await computeHash('', 'SHA-256')
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it('should compute SHA-512 of empty string', async () => {
      const hash = await computeHash('', 'SHA-512')
      expect(hash).toBe(
        'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
      )
    })

    it('should compute MD5 of "hello"', async () => {
      const hash = await computeHash('hello', 'MD5')
      expect(hash).toBe('5d41402abc4b2a76b9719d911017c592')
    })

    it('should compute SHA-256 of "hello"', async () => {
      const hash = await computeHash('hello', 'SHA-256')
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    })

    it('should handle Unicode input', async () => {
      const hash = await computeHash('Hello, World! 🌍', 'SHA-256')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should handle large input', async () => {
      const largeText = 'a'.repeat(10000)
      const hash = await computeHash(largeText, 'SHA-256')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should produce different outputs for different algorithms', async () => {
      const text = 'test'
      const results = await Promise.all(HASH_ALGORITHMS.map((algo) => computeHash(text, algo)))
      const unique = new Set(results)
      expect(unique.size).toBe(HASH_ALGORITHMS.length)
    })

    it('should produce lowercase hex output', async () => {
      const hash = await computeHash('hello', 'SHA-256')
      expect(hash).toBe(hash.toLowerCase())
      expect(hash).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('constants', () => {
    it('should have SHA-256 as default algorithm', () => {
      expect(DEFAULT_HASH_ALGORITHM).toBe('SHA-256')
    })

    it('should have 4 algorithms', () => {
      expect(HASH_ALGORITHMS).toHaveLength(4)
      expect(HASH_ALGORITHMS).toContain('MD5')
      expect(HASH_ALGORITHMS).toContain('SHA-1')
      expect(HASH_ALGORITHMS).toContain('SHA-256')
      expect(HASH_ALGORITHMS).toContain('SHA-512')
    })
  })
})
