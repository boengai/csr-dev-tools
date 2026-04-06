import { describe, expect, it } from 'vitest'

import { csvToJson, getCsvParseError, jsonToCsv } from '@/utils'

describe('csv conversion utilities', () => {
  describe('jsonToCsv', () => {
    it('should convert simple array of flat objects', async () => {
      const result = await jsonToCsv('[{"name":"Alice","age":30},{"name":"Bob","age":25}]')
      expect(result).toBe('age,name\n30,Alice\n25,Bob')
    })

    it('should flatten nested objects with dot-notation headers', async () => {
      const result = await jsonToCsv('[{"user":{"name":"Alice","city":"NYC"}}]')
      expect(result).toContain('user.city,user.name')
      expect(result).toContain('NYC,Alice')
    })

    it('should quote values containing commas', async () => {
      const result = await jsonToCsv('[{"name":"Smith, Jr.","age":40}]')
      expect(result).toContain('"Smith, Jr."')
    })

    it('should escape double quotes within values', async () => {
      const result = await jsonToCsv('[{"quote":"He said \\"hello\\""}]')
      expect(result).toContain('"He said ""hello"""')
    })

    it('should quote values containing newlines', async () => {
      const result = await jsonToCsv('[{"text":"line1\\nline2"}]')
      expect(result).toContain('"line1\nline2"')
    })

    it('should handle Unicode content', async () => {
      const result = await jsonToCsv('[{"emoji":"🎉","cjk":"日本語"}]')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should handle empty array', async () => {
      await expect(jsonToCsv('[]')).rejects.toThrow('JSON array must contain at least one object (e.g., [{"name": "Alice"}])')
    })

    it('should handle single-item array', async () => {
      const result = await jsonToCsv('[{"a":1}]')
      expect(result).toBe('a\n1')
    })

    it('should handle objects with different key sets (union of all keys)', async () => {
      const result = await jsonToCsv('[{"a":1,"b":2},{"b":3,"c":4}]')
      expect(result).toBe('a,b,c\n1,2,\n,3,4')
    })

    it('should throw on empty string', async () => {
      await expect(jsonToCsv('')).rejects.toThrow('Empty input')
    })

    it('should throw on whitespace-only string', async () => {
      await expect(jsonToCsv('   ')).rejects.toThrow('Empty input')
    })

    it('should throw on non-array JSON (object)', async () => {
      await expect(jsonToCsv('{"a":1}')).rejects.toThrow('JSON must be an array of objects (e.g., [{"name": "Alice"}])')
    })

    it('should throw on non-array JSON (string)', async () => {
      await expect(jsonToCsv('"hello"')).rejects.toThrow('JSON must be an array of objects (e.g., [{"name": "Alice"}])')
    })

    it('should throw on array of non-objects', async () => {
      await expect(jsonToCsv('[1,2,3]')).rejects.toThrow('All array items must be objects (e.g., [{"name": "Alice"}])')
    })

    it('should flatten deeply nested objects with dot-notation', async () => {
      const result = await jsonToCsv('[{"a":{"b":{"c":"deep"}}}]')
      expect(result).toBe('a.b.c\ndeep')
    })

    it('should preserve mid-field quote characters as literals', async () => {
      const result = await jsonToCsv('[{"note":"foo\\"bar"}]')
      expect(result).toContain('"foo""bar"')
    })

    it('should throw on invalid JSON', async () => {
      await expect(jsonToCsv('{invalid}')).rejects.toThrow()
    })

    it('should JSON-stringify array values in cells', async () => {
      const result = await jsonToCsv('[{"tags":["dev","tools"]}]')
      expect(result).toContain('tags')
      // Array is stringified and quoted (contains commas)
      expect(result).toMatch(/"\[.*dev.*tools.*\]"/)
    })

    it('should handle null and boolean values', async () => {
      const result = await jsonToCsv('[{"active":true,"deleted":false,"note":null}]')
      expect(result).toContain('true')
      expect(result).toContain('false')
      expect(result).toContain('null')
    })

    it('should handle large dataset', async () => {
      const arr = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `user${i}` }))
      const result = await jsonToCsv(JSON.stringify(arr))
      const lines = result.split('\n')
      expect(lines.length).toBe(101) // 1 header + 100 rows
    })
  })

  describe('csvToJson', () => {
    it('should convert simple CSV to array of objects', async () => {
      const result = await csvToJson('name,age\nAlice,30\nBob,25')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
      expect(parsed[0]).toEqual({ name: 'Alice', age: '30' })
    })

    it('should handle quoted fields containing commas', async () => {
      const result = await csvToJson('name,title\nAlice,"CTO, Inc"')
      const parsed = JSON.parse(result)
      expect(parsed[0].title).toBe('CTO, Inc')
    })

    it('should handle quoted fields containing newlines', async () => {
      const result = await csvToJson('name,bio\nAlice,"line1\nline2"')
      const parsed = JSON.parse(result)
      expect(parsed[0].bio).toBe('line1\nline2')
    })

    it('should handle escaped double quotes inside quoted fields', async () => {
      const result = await csvToJson('name,quote\nAlice,"He said ""hello"""')
      const parsed = JSON.parse(result)
      expect(parsed[0].quote).toBe('He said "hello"')
    })

    it('should handle CRLF line endings', async () => {
      const result = await csvToJson('name,age\r\nAlice,30\r\nBob,25')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
    })

    it('should handle trailing newline without creating empty row', async () => {
      const result = await csvToJson('name\nAlice\n')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(1)
    })

    it('should handle empty field values', async () => {
      const result = await csvToJson('a,b,c\n1,,3')
      const parsed = JSON.parse(result)
      expect(parsed[0]).toEqual({ a: '1', b: '', c: '3' })
    })

    it('should handle header-only CSV (no data rows)', async () => {
      const result = await csvToJson('name,age')
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(0)
    })

    it('should throw on empty string', async () => {
      await expect(csvToJson('')).rejects.toThrow('Empty input')
    })

    it('should throw on whitespace-only string', async () => {
      await expect(csvToJson('   ')).rejects.toThrow('Empty input')
    })

    it('should support custom indent', async () => {
      const result = await csvToJson('a\n1', 4)
      expect(result).toContain('    "a"')
    })

    it('should preserve mid-field quotes as literal characters', async () => {
      const result = await csvToJson('name\nfoo"bar')
      const parsed = JSON.parse(result)
      expect(parsed[0].name).toBe('foo"bar')
    })
  })

  describe('getCsvParseError', () => {
    it('should return null for valid CSV', async () => {
      expect(await getCsvParseError('name,age\nAlice,30')).toBeNull()
    })

    it('should return error for empty input', async () => {
      expect(await getCsvParseError('')).toBe('Empty input')
    })

    it('should return error for whitespace-only input', async () => {
      expect(await getCsvParseError('   ')).toBe('Empty input')
    })

    it('should return error for unterminated quoted field', async () => {
      expect(await getCsvParseError('name\n"Alice')).toBe('Unterminated quoted field')
    })

    it('should return null for mid-field quotes (treated as literals)', async () => {
      expect(await getCsvParseError('name\nfoo"bar')).toBeNull()
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through JSON→CSV→JSON round-trip', async () => {
      const original = '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]'
      const csv = await jsonToCsv(original)
      const roundTripped = await csvToJson(csv)
      expect(JSON.parse(roundTripped)).toEqual(JSON.parse(original))
    })

    it('should preserve data through CSV→JSON→CSV round-trip', async () => {
      const original = 'age,name\n30,Alice\n25,Bob'
      const json = await csvToJson(original)
      const roundTripped = await jsonToCsv(json)
      expect(roundTripped).toBe(original)
    })
  })
})
