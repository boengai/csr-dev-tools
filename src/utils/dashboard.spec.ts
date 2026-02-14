import { describe, expect, it } from 'vitest'

import { isValidLayoutValue, migrateLayoutValue } from '@/utils/dashboard'

describe('dashboard utilities', () => {
  describe('migrateLayoutValue', () => {
    it('should migrate all old feature keys to registry keys', () => {
      const old = {
        0: 'IMAGE_CONVERTOR',
        1: 'UNIX_TIMESTAMP',
        2: 'BASE64_ENCODER',
        3: 'COLOR_CONVERTER',
        4: 'IMAGE_RESIZER',
        5: 'PX_TO_REM',
      }
      const result = migrateLayoutValue(old)
      expect(result).toEqual({
        0: 'image-converter',
        1: 'unix-timestamp',
        2: 'base64-encoder',
        3: 'color-converter',
        4: 'image-resizer',
        5: 'px-to-rem',
      })
    })

    it('should preserve already-migrated registry keys', () => {
      const current = {
        0: 'image-converter',
        1: 'unix-timestamp',
        2: 'base64-encoder',
      }
      expect(migrateLayoutValue(current)).toEqual(current)
    })

    it('should clear unknown keys to null', () => {
      const value = { 0: 'UNKNOWN_TOOL', 1: 'does-not-exist' }
      expect(migrateLayoutValue(value)).toEqual({ 0: null, 1: null })
    })

    it('should preserve null positions', () => {
      const value = { 0: 'image-converter', 1: null, 2: null }
      expect(migrateLayoutValue(value)).toEqual({
        0: 'image-converter',
        1: null,
        2: null,
      })
    })

    it('should handle mixed key types correctly', () => {
      const value = {
        0: 'BASE64_ENCODER',
        1: 'color-converter',
        2: 'INVALID_KEY',
        3: null,
      }
      expect(migrateLayoutValue(value)).toEqual({
        0: 'base64-encoder',
        1: 'color-converter',
        2: null,
        3: null,
      })
    })

    it('should handle empty layout', () => {
      expect(migrateLayoutValue({})).toEqual({})
    })

    it('should handle partial layout with fewer than 6 positions', () => {
      const value = { 0: 'COLOR_CONVERTER', 1: 'px-to-rem' }
      expect(migrateLayoutValue(value)).toEqual({
        0: 'color-converter',
        1: 'px-to-rem',
      })
    })

    it('should gracefully handle unknown future tool keys by clearing to null', () => {
      const value = {
        0: 'image-converter',
        1: 'future-tool-key',
        2: 'another-new-tool',
      }
      expect(migrateLayoutValue(value)).toEqual({
        0: 'image-converter',
        1: null,
        2: null,
      })
    })

    it('should handle corrupted localStorage data by clearing non-string values to null', () => {
      const corrupted = {
        0: undefined,
        1: 42,
        2: true,
      } as unknown as Record<number, string | null>
      const result = migrateLayoutValue(corrupted)
      expect(result).toEqual({ 0: null, 1: null, 2: null })
    })
  })

  describe('isValidLayoutValue', () => {
    const validKeys = new Set([
      'base64-encoder',
      'color-converter',
      'image-converter',
      'image-resizer',
      'px-to-rem',
      'unix-timestamp',
    ])

    it('should validate default layout with all 6 tools', () => {
      const value = {
        0: 'image-converter',
        1: 'unix-timestamp',
        2: 'base64-encoder',
        3: 'color-converter',
        4: 'image-resizer',
        5: 'px-to-rem',
      }
      expect(isValidLayoutValue(value, validKeys)).toBe(true)
    })

    it('should validate layout with null positions', () => {
      const value = { 0: 'color-converter', 1: null, 2: null }
      expect(isValidLayoutValue(value, validKeys)).toBe(true)
    })

    it('should reject layout with unknown tool key', () => {
      const value = { 0: 'unknown-tool', 1: 'color-converter' }
      expect(isValidLayoutValue(value, validKeys)).toBe(false)
    })

    it('should reject layout with duplicate tool key', () => {
      const value = { 0: 'color-converter', 1: 'color-converter' }
      expect(isValidLayoutValue(value, validKeys)).toBe(false)
    })

    it('should validate empty layout', () => {
      expect(isValidLayoutValue({}, validKeys)).toBe(true)
    })

    it('should validate layout with all null positions', () => {
      const value = { 0: null, 1: null, 2: null }
      expect(isValidLayoutValue(value, validKeys)).toBe(true)
    })

    it('should reject layout with negative position keys', () => {
      const value = { [-1]: 'color-converter' } as Record<number, string | null>
      expect(isValidLayoutValue(value, validKeys)).toBe(false)
    })

    it('should reject layout with non-integer position keys', () => {
      const value = { 1.5: 'color-converter' } as unknown as Record<number, string | null>
      expect(isValidLayoutValue(value, validKeys)).toBe(false)
    })
  })
})
