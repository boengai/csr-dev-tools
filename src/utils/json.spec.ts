import { describe, expect, it } from 'vitest'

import { formatJson, getJsonParseError } from '@/utils'

describe('json formatting utilities', () => {
  describe('formatJson', () => {
    it('should format minified object with 2-space indent', async () => {
      const result = await formatJson('{"name":"John","age":30}')
      expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}')
    })

    it('should format array', async () => {
      const result = await formatJson('[1,2,3]')
      expect(result).toBe('[\n  1,\n  2,\n  3\n]')
    })

    it('should format nested objects', async () => {
      const result = await formatJson('{"a":{"b":{"c":1}}}')
      expect(result).toContain('      "c": 1')
    })

    it('should be idempotent on already-formatted JSON', async () => {
      const formatted = '{\n  "name": "John"\n}'
      expect(await formatJson(formatted)).toBe(formatted)
    })

    it('should handle primitive values', async () => {
      expect(await formatJson('"hello"')).toBe('"hello"')
      expect(await formatJson('42')).toBe('42')
      expect(await formatJson('true')).toBe('true')
      expect(await formatJson('null')).toBe('null')
    })

    it('should handle special characters in strings', async () => {
      const result = await formatJson('{"msg":"hello\\nworld","quote":"\\"hi\\""}')
      expect(result).toContain('"hello\\nworld"')
    })

    it('should handle Unicode content', async () => {
      const result = await formatJson('{"emoji":"🎉","cjk":"日本語"}')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should throw on empty string', async () => {
      await expect(formatJson('')).rejects.toThrow('Empty input')
    })

    it('should throw on whitespace-only string', async () => {
      await expect(formatJson('   ')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid JSON', async () => {
      await expect(formatJson('{invalid}')).rejects.toThrow()
    })

    it('should support custom indent', async () => {
      const result = await formatJson('{"a":1}', 4)
      expect(result).toBe('{\n    "a": 1\n}')
    })

    it('should handle large JSON objects', async () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      const input = JSON.stringify(obj)
      const result = await formatJson(input)
      expect(result.split('\n').length).toBe(102)
    })
  })

  describe('getJsonParseError', () => {
    it('should return null for valid JSON', async () => {
      expect(await getJsonParseError('{"key":"value"}')).toBeNull()
    })

    it('should return error message for invalid JSON', async () => {
      const error = await getJsonParseError('{invalid}')
      expect(error).toBeTruthy()
      expect(typeof error).toBe('string')
    })

    it('should return error for empty input', async () => {
      expect(await getJsonParseError('')).toBeTruthy()
    })

    it('should return error for whitespace-only input', async () => {
      expect(await getJsonParseError('   ')).toBeTruthy()
    })
  })
})
