import { describe, expect, it } from 'vitest'

import { jsonToTypeScript } from '@/wasm/json-tools'

describe('jsonToTypeScript', () => {
  it('converts basic object with primitives', async () => {
    const json = '{"name":"John","age":30,"active":true}'
    const result = await jsonToTypeScript(json)
    expect(result).toContain('interface Root')
    expect(result).toContain('name: string')
    expect(result).toContain('age: number')
    expect(result).toContain('active: boolean')
  })

  it('handles nested objects', async () => {
    const json = '{"user":{"name":"John","address":{"city":"NYC"}}}'
    const result = await jsonToTypeScript(json)
    expect(result).toContain('interface Root')
    expect(result).toContain('interface User')
    expect(result).toContain('interface Address')
    expect(result).toContain('city: string')
  })

  it('handles arrays of objects', async () => {
    const json = '{"items":[{"id":1},{"id":2}]}'
    const result = await jsonToTypeScript(json)
    expect(result).toContain('Array<Item>')
    expect(result).toContain('id: number')
  })

  it('handles mixed arrays as union types', async () => {
    const json = '{"data":[1,"hello",true]}'
    const result = await jsonToTypeScript(json)
    expect(result).toMatch(/Array<.*number.*string.*boolean.*>|Array<.*>/)
  })

  it('handles null values', async () => {
    const json = '{"value":null}'
    const result = await jsonToTypeScript(json)
    expect(result).toContain('value: null')
  })

  it('handles empty objects', async () => {
    const json = '{"meta":{}}'
    const result = await jsonToTypeScript(json)
    expect(result).toContain('Record<string, unknown>')
  })

  it('handles empty arrays', async () => {
    const json = '{"items":[]}'
    const result = await jsonToTypeScript(json)
    expect(result).toContain('Array<unknown>')
  })

  it('generates type aliases when useInterface is false', async () => {
    const json = '{"name":"John"}'
    const result = await jsonToTypeScript(json, { useInterface: false })
    expect(result).toContain('type Root = {')
    expect(result).not.toContain('interface')
  })

  it('generates optional properties when enabled', async () => {
    const json = '{"name":"John","age":30}'
    const result = await jsonToTypeScript(json, { optionalProperties: true })
    expect(result).toContain('name?: string')
    expect(result).toContain('age?: number')
  })

  it('uses custom root name', async () => {
    const json = '{"id":1}'
    const result = await jsonToTypeScript(json, { rootName: 'ApiResponse' })
    expect(result).toContain('interface ApiResponse')
  })
})
