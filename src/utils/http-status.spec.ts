import { describe, expect, it } from 'vitest'

import { filterHttpStatusCodes, HTTP_STATUS_CODES } from './http-status'

describe('http-status', () => {
  it('has 1xx codes', () => {
    expect(HTTP_STATUS_CODES.filter((c) => c.category === '1xx Informational').length).toBeGreaterThan(0)
  })

  it('has 2xx codes', () => {
    expect(HTTP_STATUS_CODES.filter((c) => c.category === '2xx Success').length).toBeGreaterThan(0)
  })

  it('has 4xx codes', () => {
    const codes = HTTP_STATUS_CODES.filter((c) => c.category === '4xx Client Error')
    expect(codes.length).toBeGreaterThanOrEqual(8)
  })

  it('filters by text "not found" matches 404', () => {
    const result = filterHttpStatusCodes(HTTP_STATUS_CODES, 'not found')
    expect(result.some((c) => c.code === 404)).toBe(true)
  })

  it('filters by code "200"', () => {
    const result = filterHttpStatusCodes(HTTP_STATUS_CODES, '200')
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe(200)
  })

  it('filters by category', () => {
    const result = filterHttpStatusCodes(HTTP_STATUS_CODES, '', '5xx Server Error')
    expect(result.every((c) => c.category === '5xx Server Error')).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('filters by category + text', () => {
    const result = filterHttpStatusCodes(HTTP_STATUS_CODES, 'timeout', '5xx Server Error')
    expect(result.some((c) => c.code === 504)).toBe(true)
  })

  it('returns empty for no match', () => {
    const result = filterHttpStatusCodes(HTTP_STATUS_CODES, 'zzzzz')
    expect(result).toHaveLength(0)
  })

  it('every entry has all required fields', () => {
    for (const code of HTTP_STATUS_CODES) {
      expect(code.code).toBeTypeOf('number')
      expect(code.name).toBeTypeOf('string')
      expect(code.description).toBeTypeOf('string')
      expect(code.useCase).toBeTypeOf('string')
      expect(code.category).toBeTypeOf('string')
    }
  })
})
