import { describe, expect, it } from 'vitest'

import { formatYaml, getYamlParseError, jsonToYaml, yamlToJson } from '@/utils/yaml'

describe('yaml utilities', () => {
  describe('formatYaml', () => {
    it('should format valid YAML with default indent (2 spaces)', () => {
      const result = formatYaml('a:\n    b: 1')
      expect(result).toContain('a:')
      expect(result).toContain('  b: 1')
    })

    it('should format with 4-space indent', () => {
      const result = formatYaml('a:\n  b: 1', { indent: 4 })
      expect(result).toContain('    b: 1')
    })

    it('should sort keys alphabetically when sortKeys is true', () => {
      const result = formatYaml('z: 1\na: 2\nm: 3', { sortKeys: true })
      const lines = result.trim().split('\n')
      expect(lines[0]).toBe('a: 2')
      expect(lines[1]).toBe('m: 3')
      expect(lines[2]).toBe('z: 1')
    })

    it('should not sort keys when sortKeys is false', () => {
      const result = formatYaml('z: 1\na: 2\nm: 3', { sortKeys: false })
      const lines = result.trim().split('\n')
      expect(lines[0]).toBe('z: 1')
      expect(lines[1]).toBe('a: 2')
      expect(lines[2]).toBe('m: 3')
    })

    it('should handle nested objects', () => {
      const result = formatYaml('a:\n  b:\n    c: 1')
      expect(result).toContain('a:')
      expect(result).toContain('  b:')
      expect(result).toContain('    c: 1')
    })

    it('should handle arrays', () => {
      const result = formatYaml('items:\n  - 1\n  - 2\n  - 3')
      expect(result).toContain('items:')
      expect(result).toContain('  - 1')
    })

    it('should throw on empty string', () => {
      expect(() => formatYaml('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => formatYaml('   ')).toThrow('Empty input')
    })

    it('should throw on invalid YAML', () => {
      expect(() => formatYaml('key: [unclosed')).toThrow()
    })
  })

  describe('jsonToYaml', () => {
    it('should convert simple object to YAML', () => {
      const result = jsonToYaml('{"name":"John","age":30}')
      expect(result).toContain('name: John')
      expect(result).toContain('age: 30')
    })

    it('should convert nested objects to indented YAML', () => {
      const result = jsonToYaml('{"a":{"b":{"c":1}}}')
      expect(result).toContain('a:')
      expect(result).toContain('  b:')
      expect(result).toContain('    c: 1')
    })

    it('should convert arrays to YAML list syntax', () => {
      const result = jsonToYaml('{"items":[1,2,3]}')
      expect(result).toContain('items:')
      expect(result).toContain('  - 1')
    })

    it('should handle primitive JSON values', () => {
      expect(jsonToYaml('"hello"')).toContain('hello')
      expect(jsonToYaml('42')).toContain('42')
      expect(jsonToYaml('true')).toContain('true')
      expect(jsonToYaml('null')).toContain('null')
    })

    it('should handle special characters in strings', () => {
      const result = jsonToYaml('{"msg":"hello\\nworld"}')
      expect(result).toBeTruthy()
    })

    it('should handle Unicode content', () => {
      const result = jsonToYaml('{"emoji":"🎉","cjk":"日本語"}')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should throw on empty string', () => {
      expect(() => jsonToYaml('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => jsonToYaml('   ')).toThrow('Empty input')
    })

    it('should throw on invalid JSON', () => {
      expect(() => jsonToYaml('{invalid}')).toThrow()
    })

    it('should handle large JSON objects', () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      const result = jsonToYaml(JSON.stringify(obj))
      expect(result).toContain('key0: 0')
      expect(result).toContain('key99: 99')
    })
  })

  describe('yamlToJson', () => {
    it('should convert simple YAML to formatted JSON', () => {
      const result = yamlToJson('name: John\nage: 30')
      expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}')
    })

    it('should convert nested YAML to JSON', () => {
      const result = yamlToJson('a:\n  b:\n    c: 1')
      const parsed = JSON.parse(result)
      expect(parsed.a.b.c).toBe(1)
    })

    it('should convert YAML arrays to JSON', () => {
      const result = yamlToJson('items:\n  - 1\n  - 2\n  - 3')
      const parsed = JSON.parse(result)
      expect(parsed.items).toEqual([1, 2, 3])
    })

    it('should handle multiline YAML strings (block scalar)', () => {
      const result = yamlToJson('text: |\n  line one\n  line two')
      const parsed = JSON.parse(result)
      expect(parsed.text).toContain('line one')
      expect(parsed.text).toContain('line two')
    })

    it('should throw on empty string', () => {
      expect(() => yamlToJson('')).toThrow('Empty input')
    })

    it('should throw on whitespace-only string', () => {
      expect(() => yamlToJson('   ')).toThrow('Empty input')
    })

    it('should throw on invalid YAML', () => {
      expect(() => yamlToJson('key: [unclosed')).toThrow()
    })

    it('should support custom indent', () => {
      const result = yamlToJson('a: 1', 4)
      expect(result).toBe('{\n    "a": 1\n}')
    })
  })

  describe('getYamlParseError', () => {
    it('should return null for valid YAML', () => {
      expect(getYamlParseError('name: John')).toBeNull()
    })

    it('should return error message for invalid YAML', () => {
      const error = getYamlParseError('key: [unclosed')
      expect(error).toBeTruthy()
      expect(typeof error).toBe('string')
    })

    it('should return error for empty input', () => {
      expect(getYamlParseError('')).toBe('Empty input')
    })

    it('should return error for whitespace-only input', () => {
      expect(getYamlParseError('   ')).toBe('Empty input')
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through JSON→YAML→JSON round-trip', () => {
      const original = '{"name":"John","age":30,"tags":["dev","tools"],"nested":{"key":"value"}}'
      const yaml = jsonToYaml(original)
      const roundTripped = yamlToJson(yaml)
      expect(JSON.parse(roundTripped)).toEqual(JSON.parse(original))
    })
  })
})
