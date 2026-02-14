import { describe, expect, it } from 'vitest'

import { csvToJson, getCsvParseError, jsonToCsv } from '@/utils/csv'

describe('csv conversion utilities', () => {
  describe('jsonToCsv', () => {
    it('should convert simple array of flat objects', () => {
      const result = jsonToCsv('[{"name":"Alice","age":30},{"name":"Bob","age":25}]')
      expect(result).toBe('age,name\n30,Alice\n25,Bob')
    })

    it('should flatten nested objects with dot-notation headers', () => {
      const result = jsonToCsv('[{"user":{"name":"Alice","city":"NYC"}}]')
      expect(result).toContain('user.city,user.name')
      expect(result).toContain('NYC,Alice')
    })

    it('should quote values containing commas', () => {
      const result = jsonToCsv('[{"name":"Smith, Jr.","age":40}]')
      expect(result).toContain('"Smith, Jr."')
    })

    it('should escape double quotes within values', () => {
      const result = jsonToCsv('[{"quote":"He said \\"hello\\""}]')
      expect(result).toContain('"He said ""hello"""')
    })

    it('should quote values containing newlines', () => {
      const result = jsonToCsv('[{"text":"line1\\nline2"}]')
      expect(result).toContain('"line1\nline2"')
    })

    it('should handle Unicode content', () => {
      const result = jsonToCsv('[{"emoji":"🎉","cjk":"日本語"}]')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should handle empty array', () => {
      expect(() => jsonToCsv('[]')).toThrow('JSON array must contain at least one object (e.g., [{"name": "Alice"}])')
    })

    it('should handle single-item array', () => {
      const result = jsonToCsv('[{"a":1}]')
      expect(result).toBe('a\n1')
    })

    it('should handle objects with different key sets (union of all keys)', () => {
      const result = jsonToCsv('[{"a":1,"b":2},{"b":3,"c":4}]')
      expect(result).toBe('a,b,c\n1,2,\n,3,4')
    })

    it('should throw on empty string', () => {
      expect(() => jsonToCsv('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => jsonToCsv('   ')).toThrow('Empty input')
    })

    it('should throw on non-array JSON (object)', () => {
      expect(() => jsonToCsv('{"a":1}')).toThrow('JSON must be an array of objects (e.g., [{"name": "Alice"}])')
    })

    it('should throw on non-array JSON (string)', () => {
      expect(() => jsonToCsv('"hello"')).toThrow('JSON must be an array of objects (e.g., [{"name": "Alice"}])')
    })

    it('should throw on array of non-objects', () => {
      expect(() => jsonToCsv('[1,2,3]')).toThrow('All array items must be objects (e.g., [{"name": "Alice"}])')
    })

    it('should flatten deeply nested objects with dot-notation', () => {
      const result = jsonToCsv('[{"a":{"b":{"c":"deep"}}}]')
      expect(result).toBe('a.b.c\ndeep')
    })

    it('should preserve mid-field quote characters as literals', () => {
      const result = jsonToCsv('[{"note":"foo\\"bar"}]')
      expect(result).toContain('"foo""bar"')
    })

    it('should throw on invalid JSON', () => {
      expect(() => jsonToCsv('{invalid}')).toThrow()
    })

    it('should JSON-stringify array values in cells', () => {
      const result = jsonToCsv('[{"tags":["dev","tools"]}]')
      expect(result).toContain('tags')
      // Array is stringified and quoted (contains commas)
      expect(result).toMatch(/"\[.*dev.*tools.*\]"/)
    })

    it('should handle null and boolean values', () => {
      const result = jsonToCsv('[{"active":true,"deleted":false,"note":null}]')
      expect(result).toContain('true')
      expect(result).toContain('false')
      expect(result).toContain('null')
    })

    it('should handle large dataset', () => {
      const arr = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `user${i}` }))
      const result = jsonToCsv(JSON.stringify(arr))
      const lines = result.split('\n')
      expect(lines.length).toBe(101) // 1 header + 100 rows
    })
  })

  describe('csvToJson', () => {
    it('should convert simple CSV to array of objects', () => {
      const result = csvToJson('name,age\nAlice,30\nBob,25')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
      expect(parsed[0]).toEqual({ name: 'Alice', age: '30' })
    })

    it('should handle quoted fields containing commas', () => {
      const result = csvToJson('name,title\nAlice,"CTO, Inc"')
      const parsed = JSON.parse(result)
      expect(parsed[0].title).toBe('CTO, Inc')
    })

    it('should handle quoted fields containing newlines', () => {
      const result = csvToJson('name,bio\nAlice,"line1\nline2"')
      const parsed = JSON.parse(result)
      expect(parsed[0].bio).toBe('line1\nline2')
    })

    it('should handle escaped double quotes inside quoted fields', () => {
      const result = csvToJson('name,quote\nAlice,"He said ""hello"""')
      const parsed = JSON.parse(result)
      expect(parsed[0].quote).toBe('He said "hello"')
    })

    it('should handle CRLF line endings', () => {
      const result = csvToJson('name,age\r\nAlice,30\r\nBob,25')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
    })

    it('should handle trailing newline without creating empty row', () => {
      const result = csvToJson('name\nAlice\n')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(1)
    })

    it('should handle empty field values', () => {
      const result = csvToJson('a,b,c\n1,,3')
      const parsed = JSON.parse(result)
      expect(parsed[0]).toEqual({ a: '1', b: '', c: '3' })
    })

    it('should handle header-only CSV (no data rows)', () => {
      const result = csvToJson('name,age')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(0)
    })

    it('should throw on empty string', () => {
      expect(() => csvToJson('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => csvToJson('   ')).toThrow('Empty input')
    })

    it('should support custom indent', () => {
      const result = csvToJson('a\n1', 4)
      expect(result).toContain('    "a"')
    })

    it('should preserve mid-field quotes as literal characters', () => {
      const result = csvToJson('name\nfoo"bar')
      const parsed = JSON.parse(result)
      expect(parsed[0].name).toBe('foo"bar')
    })
  })

  describe('getCsvParseError', () => {
    it('should return null for valid CSV', () => {
      expect(getCsvParseError('name,age\nAlice,30')).toBeNull()
    })

    it('should return error for empty input', () => {
      expect(getCsvParseError('')).toBe('Empty input')
    })

    it('should return error for whitespace-only input', () => {
      expect(getCsvParseError('   ')).toBe('Empty input')
    })

    it('should return error for unterminated quoted field', () => {
      expect(getCsvParseError('name\n"Alice')).toBe('Unterminated quoted field')
    })

    it('should return null for mid-field quotes (treated as literals)', () => {
      expect(getCsvParseError('name\nfoo"bar')).toBeNull()
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through JSON→CSV→JSON round-trip', () => {
      const original = '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]'
      const csv = jsonToCsv(original)
      const roundTripped = csvToJson(csv)
      expect(JSON.parse(roundTripped)).toEqual(JSON.parse(original))
    })

    it('should preserve data through CSV→JSON→CSV round-trip', () => {
      const original = 'age,name\n30,Alice\n25,Bob'
      const json = csvToJson(original)
      const roundTripped = jsonToCsv(json)
      expect(roundTripped).toBe(original)
    })
  })
})
