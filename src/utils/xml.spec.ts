import { describe, expect, it } from 'vitest'

import { xmlToJson, jsonToXml } from '@/utils/xml'

describe('xml conversion utilities', () => {
  describe('xmlToJson', () => {
    it('should convert simple XML to JSON', async () => {
      const result = await xmlToJson('<root><name>John</name><age>30</age></root>')
      const parsed = JSON.parse(result)
      expect(parsed.root.name).toBe('John')
      expect(parsed.root.age).toBe(30)
    })

    it('should handle XML attributes', async () => {
      const result = await xmlToJson('<item id="1">test</item>')
      const parsed = JSON.parse(result)
      expect(parsed.item['@_id']).toBe('1')
    })

    it('should throw on empty string', async () => {
      await expect(xmlToJson('')).rejects.toThrow('Empty input')
    })

    it('should throw on whitespace-only string', async () => {
      await expect(xmlToJson('   ')).rejects.toThrow('Empty input')
    })
  })

  describe('jsonToXml', () => {
    it('should convert simple JSON to XML', async () => {
      const result = await jsonToXml('{"root":{"name":"John","age":30}}')
      expect(result).toContain('<name>John</name>')
      expect(result).toContain('<age>30</age>')
    })

    it('should throw on empty string', async () => {
      await expect(jsonToXml('')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid JSON', async () => {
      await expect(jsonToXml('{invalid}')).rejects.toThrow()
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through XML→JSON→XML round-trip', async () => {
      const original = '<root><name>John</name><age>30</age></root>'
      const json = await xmlToJson(original)
      const xml = await jsonToXml(json)
      expect(xml).toContain('<name>John</name>')
      expect(xml).toContain('<age>30</age>')
    })
  })
})
