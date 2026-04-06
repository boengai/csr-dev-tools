import { describe, expect, it } from 'vitest'

import { convertBase, isValidForBase } from '@/utils'

describe('number base conversion utilities', () => {
  describe('convertBase', () => {
    it('should convert decimal to binary', async () => {
      expect(await convertBase('42', 10, 2)).toBe('101010')
    })

    it('should convert binary to decimal', async () => {
      expect(await convertBase('101010', 2, 10)).toBe('42')
    })

    it('should convert decimal to hex', async () => {
      expect(await convertBase('255', 10, 16)).toBe('ff')
    })

    it('should convert hex to decimal', async () => {
      expect(await convertBase('ff', 16, 10)).toBe('255')
    })

    it('should convert decimal to octal', async () => {
      expect(await convertBase('8', 10, 8)).toBe('10')
    })

    it('should convert octal to decimal', async () => {
      expect(await convertBase('10', 8, 10)).toBe('8')
    })

    it('should handle zero', async () => {
      expect(await convertBase('0', 10, 2)).toBe('0')
      expect(await convertBase('0', 2, 16)).toBe('0')
    })

    it('should handle large numbers via BigInt', async () => {
      const large = '9007199254740993' // > Number.MAX_SAFE_INTEGER
      const hex = await convertBase(large, 10, 16)
      const backToDecimal = await convertBase(hex, 16, 10)
      expect(backToDecimal).toBe(large)
    })

    it('should throw on empty input', async () => {
      await expect(convertBase('', 10, 2)).rejects.toThrow('Empty input')
    })

    it('should throw on invalid characters for base', async () => {
      await expect(convertBase('2', 2, 10)).rejects.toThrow("Invalid character '2' for base 2")
      await expect(convertBase('g', 16, 10)).rejects.toThrow("Invalid character 'g' for base 16")
    })
  })

  describe('isValidForBase', () => {
    it('should validate binary input', async () => {
      expect(await isValidForBase('0101', 2)).toBe(true)
      expect(await isValidForBase('0123', 2)).toBe(false)
    })

    it('should validate hex input', async () => {
      expect(await isValidForBase('ff00', 16)).toBe(true)
      expect(await isValidForBase('zz', 16)).toBe(false)
    })

    it('should return true for empty input', async () => {
      expect(await isValidForBase('', 10)).toBe(true)
    })
  })
})
