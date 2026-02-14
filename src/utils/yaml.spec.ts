import { describe, expect, it } from 'vitest'

import { getYamlParseError, jsonToYaml, yamlToJson } from '@/utils/yaml'

describe('yaml conversion utilities', () => {
  describe('jsonToYaml', () => {
    it('should convert simple object to YAML', async () => {
      const result = await jsonToYaml('{"name":"John","age":30}')
      expect(result).toContain('name: John')
      expect(result).toContain('age: 30')
    })

    it('should convert nested objects to indented YAML', async () => {
      const result = await jsonToYaml('{"a":{"b":{"c":1}}}')
      expect(result).toContain('a:')
      expect(result).toContain('  b:')
      expect(result).toContain('    c: 1')
    })

    it('should convert arrays to YAML list syntax', async () => {
      const result = await jsonToYaml('{"items":[1,2,3]}')
      expect(result).toContain('items:')
      expect(result).toContain('  - 1')
    })

    it('should handle primitive JSON values', async () => {
      expect(await jsonToYaml('"hello"')).toContain('hello')
      expect(await jsonToYaml('42')).toContain('42')
      expect(await jsonToYaml('true')).toContain('true')
      expect(await jsonToYaml('null')).toContain('null')
    })

    it('should handle special characters in strings', async () => {
      const result = await jsonToYaml('{"msg":"hello\\nworld"}')
      expect(result).toBeTruthy()
    })

    it('should handle Unicode content', async () => {
      const result = await jsonToYaml('{"emoji":"🎉","cjk":"日本語"}')
      expect(result).toContain('🎉')
      expect(result).toContain('日本語')
    })

    it('should throw on empty string', async () => {
      await expect(jsonToYaml('')).rejects.toThrow('Empty input')
    })

    it('should throw on whitespace-only string', async () => {
      await expect(jsonToYaml('   ')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid JSON', async () => {
      await expect(jsonToYaml('{invalid}')).rejects.toThrow()
    })

    it('should handle large JSON objects', async () => {
      const obj: Record<string, number> = {}
      for (let i = 0; i < 100; i++) obj[`key${i}`] = i
      const result = await jsonToYaml(JSON.stringify(obj))
      expect(result).toContain('key0: 0')
      expect(result).toContain('key99: 99')
    })
  })

  describe('yamlToJson', () => {
    it('should convert simple YAML to formatted JSON', async () => {
      const result = await yamlToJson('name: John\nage: 30')
      expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}')
    })

    it('should convert nested YAML to JSON', async () => {
      const result = await yamlToJson('a:\n  b:\n    c: 1')
      const parsed = JSON.parse(result)
      expect(parsed.a.b.c).toBe(1)
    })

    it('should convert YAML arrays to JSON', async () => {
      const result = await yamlToJson('items:\n  - 1\n  - 2\n  - 3')
      const parsed = JSON.parse(result)
      expect(parsed.items).toEqual([1, 2, 3])
    })

    it('should handle multiline YAML strings (block scalar)', async () => {
      const result = await yamlToJson('text: |\n  line one\n  line two')
      const parsed = JSON.parse(result)
      expect(parsed.text).toContain('line one')
      expect(parsed.text).toContain('line two')
    })

    it('should throw on empty string', async () => {
      await expect(yamlToJson('')).rejects.toThrow('Empty input')
    })

    it('should throw on whitespace-only string', async () => {
      await expect(yamlToJson('   ')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid YAML', async () => {
      await expect(yamlToJson('key: [unclosed')).rejects.toThrow()
    })

    it('should support custom indent', async () => {
      const result = await yamlToJson('a: 1', 4)
      expect(result).toBe('{\n    "a": 1\n}')
    })
  })

  describe('getYamlParseError', () => {
    it('should return null for valid YAML', async () => {
      expect(await getYamlParseError('name: John')).toBeNull()
    })

    it('should return error message for invalid YAML', async () => {
      const error = await getYamlParseError('key: [unclosed')
      expect(error).toBeTruthy()
      expect(typeof error).toBe('string')
    })

    it('should return error for empty input', async () => {
      expect(await getYamlParseError('')).toBe('Empty input')
    })

    it('should return error for whitespace-only input', async () => {
      expect(await getYamlParseError('   ')).toBe('Empty input')
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through JSON→YAML→JSON round-trip', async () => {
      const original = '{"name":"John","age":30,"tags":["dev","tools"],"nested":{"key":"value"}}'
      const yaml = await jsonToYaml(original)
      const roundTripped = await yamlToJson(yaml)
      expect(JSON.parse(roundTripped)).toEqual(JSON.parse(original))
    })
  })
})
