import { describe, expect, it } from 'vitest'

import { parseStringifiedJson, stringifyJson } from '@/utils/escaped-json'

describe('escaped json utilities', () => {
  describe('stringifyJson', () => {
    it('should escape JSON string', () => {
      const result = stringifyJson('{"name":"John","age":30}')
      expect(result).toBe('{\\"name\\":\\"John\\",\\"age\\":30}')
    })

    it('should handle JSON with newlines', () => {
      const result = stringifyJson('{\n  "name": "John"\n}')
      expect(result).toContain('\\n')
    })

    it('should double-escape when option enabled', () => {
      const result = stringifyJson('{"a":1}', true)
      expect(result).toContain('\\\\')
    })

    it('should throw on invalid JSON', () => {
      expect(() => stringifyJson('{bad}')).toThrow()
    })

    it('should throw on empty input', () => {
      expect(() => stringifyJson('')).toThrow('Empty input')
    })
  })

  describe('parseStringifiedJson', () => {
    it('should unescape and pretty-print JSON', () => {
      const result = parseStringifiedJson('{\\"name\\":\\"John\\",\\"age\\":30}')
      expect(JSON.parse(result)).toEqual({ name: 'John', age: 30 })
    })

    it('should throw on invalid input', () => {
      expect(() => parseStringifiedJson('not-escaped-json')).toThrow()
    })

    it('should throw on empty input', () => {
      expect(() => parseStringifiedJson('')).toThrow('Empty input')
    })
  })
})
