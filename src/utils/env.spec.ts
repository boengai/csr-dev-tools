import { describe, expect, it } from 'vitest'

import { envToJson, envToYaml, jsonToEnv, parseEnv, yamlToEnv } from '@/utils/env'

describe('env utilities', () => {
  describe('parseEnv', () => {
    it('should parse simple KEY=value pairs', () => {
      const { entries, warnings } = parseEnv('FOO=bar\nBAZ=qux')
      expect(entries).toEqual([
        { key: 'FOO', value: 'bar' },
        { key: 'BAZ', value: 'qux' },
      ])
      expect(warnings).toHaveLength(0)
    })

    it('should handle quoted values', () => {
      const { entries } = parseEnv('NAME="hello world"\nSINGLE=\'quoted\'')
      expect(entries[0].value).toBe('hello world')
      expect(entries[1].value).toBe('quoted')
    })

    it('should skip comments and empty lines', () => {
      const { entries } = parseEnv('# comment\nFOO=bar\n\nBAZ=qux')
      expect(entries).toHaveLength(2)
    })

    it('should warn on malformed lines', () => {
      const { warnings } = parseEnv('FOO=bar\nBADLINE\nBAZ=qux')
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('Line 2')
    })

    it('should handle values with = signs', () => {
      const { entries } = parseEnv('URL=https://example.com?a=1&b=2')
      expect(entries[0].value).toBe('https://example.com?a=1&b=2')
    })

    it('should throw on empty input', () => {
      expect(() => parseEnv('')).toThrow('Empty input')
    })
  })

  describe('envToJson', () => {
    it('should convert .env to JSON', () => {
      const { output } = envToJson('FOO=bar\nBAZ=123')
      const parsed = JSON.parse(output)
      expect(parsed.FOO).toBe('bar')
      expect(parsed.BAZ).toBe('123')
    })

    it('should return warnings for malformed lines', () => {
      const { warnings } = envToJson('FOO=bar\nBAD')
      expect(warnings).toHaveLength(1)
    })
  })

  describe('envToYaml', () => {
    it('should convert .env to YAML', () => {
      const { output } = envToYaml('NAME=John\nAGE=30')
      expect(output).toContain('NAME: John')
      expect(output).toContain('AGE: "30"')
    })
  })

  describe('jsonToEnv', () => {
    it('should convert JSON object to .env format', () => {
      const result = jsonToEnv('{"FOO":"bar","BAZ":"qux"}')
      expect(result).toContain('FOO=bar')
      expect(result).toContain('BAZ=qux')
    })

    it('should quote values with spaces', () => {
      const result = jsonToEnv('{"NAME":"hello world"}')
      expect(result).toBe('NAME="hello world"')
    })

    it('should throw on non-object JSON', () => {
      expect(() => jsonToEnv('[1,2,3]')).toThrow('Input must be a JSON object')
    })

    it('should throw on empty input', () => {
      expect(() => jsonToEnv('')).toThrow('Empty input')
    })

    it('should throw on nested object values', () => {
      expect(() => jsonToEnv('{"config":{"host":"localhost"}}')).toThrow('nested object/array')
    })

    it('should throw on array values', () => {
      expect(() => jsonToEnv('{"tags":["a","b"]}')).toThrow('nested object/array')
    })

    it('should escape inner double quotes in values', () => {
      const result = jsonToEnv('{"MSG":"he said \\"hello\\""}')
      expect(result).toBe('MSG="he said \\"hello\\""')
    })
  })

  describe('yamlToEnv', () => {
    it('should convert YAML mapping to .env format', () => {
      const result = yamlToEnv('FOO: bar\nBAZ: qux')
      expect(result).toContain('FOO=bar')
      expect(result).toContain('BAZ=qux')
    })

    it('should throw on non-mapping YAML', () => {
      expect(() => yamlToEnv('- item1\n- item2')).toThrow('Input must be a YAML mapping')
    })

    it('should throw on empty input', () => {
      expect(() => yamlToEnv('')).toThrow('Empty input')
    })

    it('should throw on nested mapping values', () => {
      expect(() => yamlToEnv('config:\n  host: localhost')).toThrow('nested object/array')
    })
  })
})
