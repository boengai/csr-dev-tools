import { describe, expect, it } from 'vitest'

import { parseUrl } from './url-parse'

describe('parseUrl', () => {
  it('parses full URL', () => {
    const result = parseUrl('https://example.com:8080/path?key=value#section')
    expect(result.protocol).toBe('https:')
    expect(result.hostname).toBe('example.com')
    expect(result.port).toBe('8080')
    expect(result.pathname).toBe('/path')
    expect(result.hash).toBe('#section')
    expect(result.searchParams).toEqual([{ key: 'key', value: 'value' }])
  })

  it('parses URL without port', () => {
    const result = parseUrl('https://example.com/path')
    expect(result.port).toBe('')
    expect(result.hostname).toBe('example.com')
  })

  it('parses URL without query params', () => {
    const result = parseUrl('https://example.com/path')
    expect(result.searchParams).toEqual([])
  })

  it('parses URL without hash', () => {
    const result = parseUrl('https://example.com/path')
    expect(result.hash).toBe('')
  })

  it('parses multiple query params', () => {
    const result = parseUrl('https://example.com?a=1&b=2&c=3')
    expect(result.searchParams).toHaveLength(3)
    expect(result.searchParams[0]).toEqual({ key: 'a', value: '1' })
    expect(result.searchParams[2]).toEqual({ key: 'c', value: '3' })
  })

  it('handles encoded query params', () => {
    const result = parseUrl('https://example.com?name=hello%20world')
    expect(result.searchParams[0].value).toBe('hello world')
  })

  it('returns error for invalid URL', () => {
    const result = parseUrl('not a url')
    expect(result.error).toBe('Invalid URL — enter a fully qualified URL (e.g., https://example.com)')
  })

  it('returns error for empty string', () => {
    const result = parseUrl('')
    expect(result.error).toBe('Invalid URL — enter a fully qualified URL (e.g., https://example.com)')
  })

  it('parses URL with only protocol and host', () => {
    const result = parseUrl('https://example.com')
    expect(result.protocol).toBe('https:')
    expect(result.hostname).toBe('example.com')
    expect(result.pathname).toBe('/')
  })

  it('handles no error field on success', () => {
    const result = parseUrl('https://example.com')
    expect(result.error).toBeUndefined()
  })
})
