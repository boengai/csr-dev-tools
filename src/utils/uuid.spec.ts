import { describe, expect, it } from 'vitest'

import { generateBulkUuids, generateUuid } from '@/utils/uuid'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('uuid utilities', () => {
  describe('generateUuid', () => {
    it('should return a valid UUID v4 format', () => {
      const uuid = generateUuid()
      expect(uuid).toMatch(UUID_V4_REGEX)
    })

    it('should return different values on consecutive calls', () => {
      const uuid1 = generateUuid()
      const uuid2 = generateUuid()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('generateBulkUuids', () => {
    it('should generate 1 UUID when count is 1', () => {
      const uuids = generateBulkUuids(1)
      expect(uuids).toHaveLength(1)
      expect(uuids[0]).toMatch(UUID_V4_REGEX)
    })

    it('should generate the requested number of UUIDs', () => {
      const uuids = generateBulkUuids(10)
      expect(uuids).toHaveLength(10)
      for (const uuid of uuids) {
        expect(uuid).toMatch(UUID_V4_REGEX)
      }
    })

    it('should generate 100 UUIDs at max boundary', () => {
      const uuids = generateBulkUuids(100)
      expect(uuids).toHaveLength(100)
    })

    it('should clamp count to minimum of 1 when given 0', () => {
      const uuids = generateBulkUuids(0)
      expect(uuids).toHaveLength(1)
    })

    it('should clamp count to maximum of 100 when exceeding limit', () => {
      const uuids = generateBulkUuids(150)
      expect(uuids).toHaveLength(100)
    })

    it('should clamp negative count to 1', () => {
      const uuids = generateBulkUuids(-1)
      expect(uuids).toHaveLength(1)
      expect(uuids[0]).toMatch(UUID_V4_REGEX)
    })

    it('should floor fractional count', () => {
      const uuids = generateBulkUuids(5.7)
      expect(uuids).toHaveLength(5)
    })

    it('should handle NaN count by returning 1 UUID', () => {
      const uuids = generateBulkUuids(NaN)
      expect(uuids).toHaveLength(1)
      expect(uuids[0]).toMatch(UUID_V4_REGEX)
    })

    it('should generate all unique UUIDs in bulk', () => {
      const uuids = generateBulkUuids(50)
      const uniqueSet = new Set(uuids)
      expect(uniqueSet.size).toBe(uuids.length)
    })
  })
})
