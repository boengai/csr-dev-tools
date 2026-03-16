import { describe, expect, it } from 'vitest'

import { deepSortJson, getJsonDiffError, normalizeJson } from '@/utils/json-diff'

describe('json diff utilities', () => {
  describe('deepSortJson', () => {
    it('should sort object keys alphabetically', () => {
      const result = deepSortJson({ z: 1, a: 2, m: 3 })
      expect(Object.keys(result as Record<string, unknown>)).toEqual(['a', 'm', 'z'])
    })

    it('should sort deeply nested object keys', () => {
      const result = deepSortJson({ b: { z: 1, a: 2 }, a: { y: 3, x: 4 } })
      const outer = Object.keys(result as Record<string, unknown>)
      expect(outer).toEqual(['a', 'b'])
      expect(Object.keys((result as Record<string, Record<string, unknown>>).a)).toEqual(['x', 'y'])
    })

    it('should sort arrays of primitives by value', () => {
      expect(deepSortJson([3, 1, 2])).toEqual([1, 2, 3])
      expect(deepSortJson(['c', 'a', 'b'])).toEqual(['a', 'b', 'c'])
    })

    it('should sort arrays of objects by stringified content', () => {
      const result = deepSortJson([{ b: 2 }, { a: 1 }])
      expect(result).toEqual([{ a: 1 }, { b: 2 }])
    })

    it('should handle mixed arrays (primitives + objects)', () => {
      const result = deepSortJson([{ z: 1 }, 'hello', 42, { a: 2 }])
      expect(result).toEqual(['hello', 42, { a: 2 }, { z: 1 }])
    })

    it('should handle empty objects', () => {
      expect(deepSortJson({})).toEqual({})
    })

    it('should handle empty arrays', () => {
      expect(deepSortJson([])).toEqual([])
    })

    it('should pass through primitives unchanged', () => {
      expect(deepSortJson(null)).toBe(null)
      expect(deepSortJson(true)).toBe(true)
      expect(deepSortJson(42)).toBe(42)
      expect(deepSortJson('hello')).toBe('hello')
    })
  })

  describe('normalizeJson', () => {
    it('should sort keys and format with 2-space indent', () => {
      const result = normalizeJson('{"z":1,"a":2}')
      expect(result).toBe('{\n  "a": 2,\n  "z": 1\n}')
    })

    it('should produce identical output for differently-ordered keys', () => {
      const a = normalizeJson('{"name":"John","age":30}')
      const b = normalizeJson('{"age":30,"name":"John"}')
      expect(a).toBe(b)
    })

    it('should throw on invalid JSON', () => {
      expect(() => normalizeJson('{invalid}')).toThrow()
    })

    it('should throw on empty string', () => {
      expect(() => normalizeJson('')).toThrow()
    })

    it('should show type differences', () => {
      const a = normalizeJson('{"val": "123"}')
      const b = normalizeJson('{"val": 123}')
      expect(a).not.toBe(b)
    })

    it('should normalize arrays with same content in different order', () => {
      const a = normalizeJson('[3, 1, 2]')
      const b = normalizeJson('[1, 2, 3]')
      expect(a).toBe(b)
    })

    it('should show deep nested changes', () => {
      const a = normalizeJson('{"a":{"b":{"c":1}}}')
      const b = normalizeJson('{"a":{"b":{"c":2}}}')
      expect(a).not.toBe(b)
      expect(a).toContain('"c": 1')
      expect(b).toContain('"c": 2')
    })

    it('should normalize arrays of objects with same content in different order', () => {
      const a = normalizeJson('[{"b":2},{"a":1}]')
      const b = normalizeJson('[{"a":1},{"b":2}]')
      expect(a).toBe(b)
    })

    it('should handle arrays with different content', () => {
      const a = normalizeJson('[1, 2, 3]')
      const b = normalizeJson('[1, 2, 4]')
      expect(a).not.toBe(b)
    })

    it('should show null vs "null" type mismatch', () => {
      const a = normalizeJson('{"val": null}')
      const b = normalizeJson('{"val": "null"}')
      expect(a).not.toBe(b)
      expect(a).toContain('null')
      expect(b).toContain('"null"')
    })

    it('should show missing keys as differences', () => {
      const a = normalizeJson('{"a": 1, "b": 2}')
      const b = normalizeJson('{"a": 1}')
      expect(a).not.toBe(b)
      expect(a).toContain('"b"')
      expect(b).not.toContain('"b"')
    })

    it('should show added keys as differences', () => {
      const a = normalizeJson('{"a": 1}')
      const b = normalizeJson('{"a": 1, "c": 3}')
      expect(a).not.toBe(b)
      expect(b).toContain('"c"')
      expect(a).not.toContain('"c"')
    })

    it('should handle empty object JSON', () => {
      const result = normalizeJson('{}')
      expect(result).toBe('{}')
    })

    it('should handle empty array JSON', () => {
      const result = normalizeJson('[]')
      expect(result).toBe('[]')
    })

    it('should handle large JSON (100+ keys)', () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      expect(() => normalizeJson(JSON.stringify(obj))).not.toThrow()
    })
  })

  describe('getJsonDiffError', () => {
    it('should return null for valid JSON', () => {
      expect(getJsonDiffError('{"key":"value"}', 'Original')).toBeNull()
    })

    it('should return labeled error for invalid JSON', () => {
      const error = getJsonDiffError('{invalid}', 'Original')
      expect(error).toContain('Original')
      expect(error).toContain('invalid')
    })

    it('should return null for empty string', () => {
      expect(getJsonDiffError('', 'Original')).toBeNull()
    })

    it('should return null for whitespace-only string', () => {
      expect(getJsonDiffError('   ', 'Modified')).toBeNull()
    })
  })
})
