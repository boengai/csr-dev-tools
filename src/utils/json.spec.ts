import { describe, expect, it } from 'vitest'

import { formatJson, getJsonParseError } from '@/utils/json'

describe('json formatting utilities', () => {
  describe('formatJson', () => {
    it('should format minified object with 2-space indent', () => {
      const result = formatJson('{"name":"John","age":30}')
      expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}')
    })

    it('should format array', () => {
      const result = formatJson('[1,2,3]')
      expect(result).toBe('[\n  1,\n  2,\n  3\n]')
    })

    it('should format nested objects', () => {
      const result = formatJson('{"a":{"b":{"c":1}}}')
      expect(result).toContain('      "c": 1')
    })

    it('should be idempotent on already-formatted JSON', () => {
      const formatted = '{\n  "name": "John"\n}'
      expect(formatJson(formatted)).toBe(formatted)
    })

    it('should handle primitive values', () => {
      expect(formatJson('"hello"')).toBe('"hello"')
      expect(formatJson('42')).toBe('42')
      expect(formatJson('true')).toBe('true')
      expect(formatJson('null')).toBe('null')
    })

    it('should handle special characters in strings', () => {
      const result = formatJson('{"msg":"hello\\nworld","quote":"\\"hi\\""}')
      expect(result).toContain('"hello\\nworld"')
    })

    it('should handle Unicode content', () => {
      const result = formatJson('{"emoji":"🎉","cjk":"日本語"}')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should throw on empty string', () => {
      expect(() => formatJson('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => formatJson('   ')).toThrow('Empty input')
    })

    it('should throw on invalid JSON', () => {
      expect(() => formatJson('{invalid}')).toThrow(SyntaxError)
    })

    it('should support custom indent', () => {
      const result = formatJson('{"a":1}', 4)
      expect(result).toBe('{\n    "a": 1\n}')
    })

    it('should handle large JSON objects', () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      const input = JSON.stringify(obj)
      const result = formatJson(input)
      expect(result.split('\n').length).toBe(102)
    })
  })

  describe('getJsonParseError', () => {
    it('should return null for valid JSON', () => {
      expect(getJsonParseError('{"key":"value"}')).toBeNull()
    })

    it('should return error message for invalid JSON', () => {
      const error = getJsonParseError('{invalid}')
      expect(error).toBeTruthy()
      expect(typeof error).toBe('string')
    })

    it('should return error for empty input', () => {
      expect(getJsonParseError('')).toBeTruthy()
    })

    it('should return error for whitespace-only input', () => {
      expect(getJsonParseError('   ')).toBeTruthy()
    })
  })
})
