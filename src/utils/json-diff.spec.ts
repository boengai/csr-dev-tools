import { describe, expect, it } from 'vitest'

import { deepSortJson, getJsonDiffError, normalizeJson } from '@/utils/json-diff'

describe('json diff utilities', () => {
  describe('deepSortJson', () => {
    it('should sort object keys alphabetically', async () => {
      const result = JSON.parse(await deepSortJson(JSON.stringify({ z: 1, a: 2, m: 3 })))
      expect(Object.keys(result as Record<string, unknown>)).toEqual(['a', 'm', 'z'])
    })

    it('should sort deeply nested object keys', async () => {
      const result = JSON.parse(await deepSortJson(JSON.stringify({ b: { z: 1, a: 2 }, a: { y: 3, x: 4 } })))
      const outer = Object.keys(result as Record<string, unknown>)
      expect(outer).toEqual(['a', 'b'])
      expect(Object.keys((result as Record<string, Record<string, unknown>>).a)).toEqual(['x', 'y'])
    })

    it('should sort arrays of primitives by value', async () => {
      expect(JSON.parse(await deepSortJson('[3, 1, 2]'))).toEqual([1, 2, 3])
      expect(JSON.parse(await deepSortJson('["c", "a", "b"]'))).toEqual(['a', 'b', 'c'])
    })

    it('should sort arrays of objects by stringified content', async () => {
      const result = JSON.parse(await deepSortJson(JSON.stringify([{ b: 2 }, { a: 1 }])))
      expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('should handle mixed arrays (primitives + objects)', async () => {
      const result = JSON.parse(await deepSortJson(JSON.stringify([{ z: 1 }, 'hello', 42, { a: 2 }])))
      expect(result).toEqual(['hello', 42, { a: 2 }, { z: 1 }])
    })

    it('should handle empty objects', async () => {
      expect(JSON.parse(await deepSortJson('{}'))).toEqual({})
    })

    it('should handle empty arrays', async () => {
      expect(JSON.parse(await deepSortJson('[]'))).toEqual([])
    })

    it('should pass through primitives unchanged', async () => {
      expect(JSON.parse(await deepSortJson('null'))).toBe(null)
      expect(JSON.parse(await deepSortJson('true'))).toBe(true)
      expect(JSON.parse(await deepSortJson('42'))).toBe(42)
      expect(JSON.parse(await deepSortJson('"hello"'))).toBe('hello')
    })
  })

  describe('normalizeJson', () => {
    it('should sort keys and format with 2-space indent', async () => {
      const result = await normalizeJson('{"z":1,"a":2}')
      expect(result).toBe('{\n  "a": 2,\n  "z": 1\n}')
    })

    it('should produce identical output for differently-ordered keys', async () => {
      const a = await normalizeJson('{"name":"John","age":30}')
      const b = await normalizeJson('{"age":30,"name":"John"}')
      expect(a).toBe(b)
    })

    it('should throw on invalid JSON', async () => {
      await expect(normalizeJson('{invalid}')).rejects.toThrow()
    })

    it('should throw on empty string', async () => {
      await expect(normalizeJson('')).rejects.toThrow()
    })

    it('should show type differences', async () => {
      const a = await normalizeJson('{"val": "123"}')
      const b = await normalizeJson('{"val": 123}')
      expect(a).not.toBe(b)
    })

    it('should normalize arrays with same content in different order', async () => {
      const a = await normalizeJson('[3, 1, 2]')
      const b = await normalizeJson('[1, 2, 3]')
      expect(a).toBe(b)
    })

    it('should show deep nested changes', async () => {
      const a = await normalizeJson('{"a":{"b":{"c":1}}}')
      const b = await normalizeJson('{"a":{"b":{"c":2}}}')
      expect(a).not.toBe(b)
      expect(a).toContain('"c": 1')
      expect(b).toContain('"c": 2')
    })

    it('should normalize arrays of objects with same content in different order', async () => {
      const a = await normalizeJson('[{"b":2},{"a":1}]')
      const b = await normalizeJson('[{"a":1},{"b":2}]')
      expect(a).toBe(b)
    })

    it('should handle arrays with different content', async () => {
      const a = await normalizeJson('[1, 2, 3]')
      const b = await normalizeJson('[1, 2, 4]')
      expect(a).not.toBe(b)
    })

    it('should show null vs "null" type mismatch', async () => {
      const a = await normalizeJson('{"val": null}')
      const b = await normalizeJson('{"val": "null"}')
      expect(a).not.toBe(b)
      expect(a).toContain('null')
      expect(b).toContain('"null"')
    })

    it('should show missing keys as differences', async () => {
      const a = await normalizeJson('{"a": 1, "b": 2}')
      const b = await normalizeJson('{"a": 1}')
      expect(a).not.toBe(b)
      expect(a).toContain('"b"')
      expect(b).not.toContain('"b"')
    })

    it('should show added keys as differences', async () => {
      const a = await normalizeJson('{"a": 1}')
      const b = await normalizeJson('{"a": 1, "c": 3}')
      expect(a).not.toBe(b)
      expect(b).toContain('"c"')
      expect(a).not.toContain('"c"')
    })

    it('should handle empty object JSON', async () => {
      const result = await normalizeJson('{}')
      expect(result).toBe('{}')
    })

    it('should handle empty array JSON', async () => {
      const result = await normalizeJson('[]')
      expect(result).toBe('[]')
    })

    it('should handle large JSON (100+ keys)', async () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      await expect(normalizeJson(JSON.stringify(obj))).resolves.toBeTruthy()
    })
  })

  describe('getJsonDiffError', () => {
    it('should return null for valid JSON', async () => {
      expect(await getJsonDiffError('{"key":"value"}', 'Original')).toBeNull()
    })

    it('should return labeled error for invalid JSON', async () => {
      const error = await getJsonDiffError('{invalid}', 'Original')
      expect(error).toContain('Original')
      expect(error).toContain('invalid')
    })

    it('should return null for empty string', async () => {
      expect(await getJsonDiffError('', 'Original')).toBeNull()
    })

    it('should return null for whitespace-only string', async () => {
      expect(await getJsonDiffError('   ', 'Modified')).toBeNull()
    })
  })
})
