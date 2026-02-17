import { describe, expect, it } from 'vitest'

import { validateJsonSchema } from './json-schema'

describe('validateJsonSchema', () => {
  const simpleSchema = JSON.stringify({
    type: 'object',
    required: ['name', 'age'],
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
  })

  it('returns valid for matching data', () => {
    const data = JSON.stringify({ name: 'John', age: 30 })
    const result = validateJsonSchema(data, simpleSchema)
    expect(result.valid).toBe(true)
    expect(result.errors).toBeNull()
  })

  it('returns error with correct path and type keyword for wrong type', () => {
    const data = JSON.stringify({ name: 'John', age: 'thirty' })
    const result = validateJsonSchema(data, simpleSchema)
    expect(result.valid).toBe(false)
    expect(result.errors).not.toBeNull()
    const typeError = result.errors!.find((e) => e.keyword === 'type')
    expect(typeError).toBeDefined()
    expect(typeError!.path).toBe('/age')
  })

  it('returns error with required keyword for missing field', () => {
    const data = JSON.stringify({ name: 'John' })
    const result = validateJsonSchema(data, simpleSchema)
    expect(result.valid).toBe(false)
    const reqError = result.errors!.find((e) => e.keyword === 'required')
    expect(reqError).toBeDefined()
  })

  it('validates array items', () => {
    const schema = JSON.stringify({
      type: 'array',
      items: { type: 'number' },
    })
    const data = JSON.stringify([1, 'two', 3])
    const result = validateJsonSchema(data, schema)
    expect(result.valid).toBe(false)
    expect(result.errors!.length).toBeGreaterThan(0)
    expect(result.errors![0].path).toBe('/1')
  })

  it('validates nested objects with deep paths', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            zip: { type: 'string' },
          },
        },
      },
    })
    const data = JSON.stringify({ address: { zip: 12345 } })
    const result = validateJsonSchema(data, schema)
    expect(result.valid).toBe(false)
    expect(result.errors![0].path).toBe('/address/zip')
  })

  it('returns parse error for malformed JSON data', () => {
    const result = validateJsonSchema('{bad json', simpleSchema)
    expect(result.valid).toBe(false)
    expect(result.errors![0].keyword).toBe('parse')
    expect(result.errors![0].message).toContain('data input')
  })

  it('returns parse error for malformed schema', () => {
    const result = validateJsonSchema('{}', '{bad schema')
    expect(result.valid).toBe(false)
    expect(result.errors![0].keyword).toBe('parse')
    expect(result.errors![0].message).toContain('schema input')
  })

  it('returns parse error for empty string data', () => {
    const result = validateJsonSchema('', simpleSchema)
    expect(result.valid).toBe(false)
    expect(result.errors![0].keyword).toBe('parse')
  })

  it('returns parse error for empty string schema', () => {
    const result = validateJsonSchema('{}', '')
    expect(result.valid).toBe(false)
    expect(result.errors![0].keyword).toBe('parse')
  })

  it('returns multiple errors with allErrors true', () => {
    const data = JSON.stringify({ name: 123 })
    const result = validateJsonSchema(data, simpleSchema)
    expect(result.valid).toBe(false)
    expect(result.errors!.length).toBeGreaterThanOrEqual(2)
  })
})
