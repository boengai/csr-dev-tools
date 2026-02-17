import { describe, expect, it } from 'vitest'

import { getTomlParseError, jsonToToml, tomlToJson } from '@/utils/toml'

describe('toml conversion utilities', () => {
  describe('tomlToJson', () => {
    it('should convert simple TOML to JSON', async () => {
      const result = await tomlToJson('name = "John"\nage = 30')
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
    })

    it('should convert nested TOML tables', async () => {
      const result = await tomlToJson('[server]\nhost = "localhost"\nport = 8080')
      const parsed = JSON.parse(result)
      expect(parsed.server.host).toBe('localhost')
      expect(parsed.server.port).toBe(8080)
    })

    it('should throw on empty string', async () => {
      await expect(tomlToJson('')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid TOML', async () => {
      await expect(tomlToJson('[invalid')).rejects.toThrow()
    })
  })

  describe('jsonToToml', () => {
    it('should convert simple JSON to TOML', async () => {
      const result = await jsonToToml('{"name":"John","age":30}')
      expect(result).toContain('name = "John"')
      expect(result).toContain('age = 30')
    })

    it('should throw on empty string', async () => {
      await expect(jsonToToml('')).rejects.toThrow('Empty input')
    })

    it('should throw on invalid JSON', async () => {
      await expect(jsonToToml('{invalid}')).rejects.toThrow()
    })
  })

  describe('getTomlParseError', () => {
    it('should return null for valid TOML', async () => {
      expect(await getTomlParseError('name = "John"')).toBeNull()
    })

    it('should return error for invalid TOML', async () => {
      const error = await getTomlParseError('[invalid')
      expect(error).toBeTruthy()
    })

    it('should return error for empty input', async () => {
      expect(await getTomlParseError('')).toBe('Empty input')
    })
  })

  describe('round-trip consistency', () => {
    it('should preserve data through JSON→TOML→JSON round-trip', async () => {
      const original = '{"name":"John","age":30}'
      const toml = await jsonToToml(original)
      const roundTripped = await tomlToJson(toml)
      expect(JSON.parse(roundTripped)).toEqual(JSON.parse(original))
    })
  })
})
