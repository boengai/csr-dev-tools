import { describe, expect, it } from 'vitest'

import { generateBulkUuids, generateUuid } from '@/utils'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('uuid utilities', () => {
  describe('generateUuid', () => {
    it('should return a valid UUID v4 format', async () => {
      const uuid = await generateUuid()
      expect(uuid).toMatch(UUID_V4_REGEX)
    })

    it('should return different values on consecutive calls', async () => {
      const uuid1 = await generateUuid()
      const uuid2 = await generateUuid()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('generateBulkUuids', () => {
    it('should generate 1 UUID when count is 1', async () => {
      const uuids = await generateBulkUuids(1)
      expect(uuids).toHaveLength(1)
      expect(uuids[0]).toMatch(UUID_V4_REGEX)
    })

    it('should generate the requested number of UUIDs', async () => {
      const uuids = await generateBulkUuids(10)
      expect(uuids).toHaveLength(10)
      for (const uuid of uuids) {
        expect(uuid).toMatch(UUID_V4_REGEX)
      }
    })

    it('should generate 100 UUIDs at max boundary', async () => {
      const uuids = await generateBulkUuids(100)
      expect(uuids).toHaveLength(100)
    })

    it('should clamp count to minimum of 1 when given 0', async () => {
      const uuids = await generateBulkUuids(0)
      expect(uuids).toHaveLength(1)
    })

    it('should clamp count to maximum of 100 when exceeding limit', async () => {
      const uuids = await generateBulkUuids(150)
      expect(uuids).toHaveLength(100)
    })

    it('should clamp negative count to 1', async () => {
      const uuids = await generateBulkUuids(-1)
      expect(uuids).toHaveLength(1)
      expect(uuids[0]).toMatch(UUID_V4_REGEX)
    })

    it('should floor fractional count', async () => {
      const uuids = await generateBulkUuids(5.7)
      expect(uuids).toHaveLength(5)
    })

    it('should handle NaN count by returning 1 UUID', async () => {
      const uuids = await generateBulkUuids(NaN)
      expect(uuids).toHaveLength(1)
      expect(uuids[0]).toMatch(UUID_V4_REGEX)
    })

    it('should generate all unique UUIDs in bulk', async () => {
      const uuids = await generateBulkUuids(50)
      const uniqueSet = new Set(uuids)
      expect(uniqueSet.size).toBe(uuids.length)
    })
  })
})
