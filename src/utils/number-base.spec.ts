import { describe, expect, it } from 'vitest'

import { convertBase, isValidForBase } from '@/utils/number-base'

describe('number base conversion utilities', () => {
  describe('convertBase', () => {
    it('should convert decimal to binary', () => {
      expect(convertBase('42', 10, 2)).toBe('101010')
    })

    it('should convert binary to decimal', () => {
      expect(convertBase('101010', 2, 10)).toBe('42')
    })

    it('should convert decimal to hex', () => {
      expect(convertBase('255', 10, 16)).toBe('ff')
    })

    it('should convert hex to decimal', () => {
      expect(convertBase('ff', 16, 10)).toBe('255')
    })

    it('should convert decimal to octal', () => {
      expect(convertBase('8', 10, 8)).toBe('10')
    })

    it('should convert octal to decimal', () => {
      expect(convertBase('10', 8, 10)).toBe('8')
    })

    it('should handle zero', () => {
      expect(convertBase('0', 10, 2)).toBe('0')
      expect(convertBase('0', 2, 16)).toBe('0')
    })

    it('should handle large numbers via BigInt', () => {
      const large = '9007199254740993' // > Number.MAX_SAFE_INTEGER
      const hex = convertBase(large, 10, 16)
      const backToDecimal = convertBase(hex, 16, 10)
      expect(backToDecimal).toBe(large)
    })

    it('should throw on empty input', () => {
      expect(() => convertBase('', 10, 2)).toThrow('Empty input')
    })

    it('should throw on invalid characters for base', () => {
      expect(() => convertBase('2', 2, 10)).toThrow("Invalid character '2' for base 2")
      expect(() => convertBase('g', 16, 10)).toThrow("Invalid character 'g' for base 16")
    })
  })

  describe('isValidForBase', () => {
    it('should validate binary input', () => {
      expect(isValidForBase('0101', 2)).toBe(true)
      expect(isValidForBase('0123', 2)).toBe(false)
    })

    it('should validate hex input', () => {
      expect(isValidForBase('ff00', 16)).toBe(true)
      expect(isValidForBase('zz', 16)).toBe(false)
    })

    it('should return true for empty input', () => {
      expect(isValidForBase('', 10)).toBe(true)
    })
  })
})
