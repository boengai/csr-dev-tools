/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readJsonStorage, writeJsonStorage } from './jsonStorage'

const KEY = 'jsonStorage-test-key'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readJsonStorage', () => {
  it('returns the fallback when the key is absent', () => {
    expect(readJsonStorage(KEY, 'default')).toBe('default')
    expect(readJsonStorage(KEY, { a: 1 })).toEqual({ a: 1 })
  })

  it('returns the JSON-parsed value when the key is present', () => {
    localStorage.setItem(KEY, JSON.stringify({ jsonData: 'X', jsonSchema: 'Y' }))
    expect(readJsonStorage(KEY, { jsonData: '', jsonSchema: '' })).toEqual({
      jsonData: 'X',
      jsonSchema: 'Y',
    })
  })

  it('returns the fallback when the stored value is corrupt JSON', () => {
    localStorage.setItem(KEY, 'not valid json{{{')
    expect(readJsonStorage(KEY, 'default')).toBe('default')
  })
})

describe('writeJsonStorage', () => {
  it('writes the JSON-encoded value', () => {
    writeJsonStorage(KEY, { a: 1, b: 'two' })
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual({ a: 1, b: 'two' })
  })

  it('swallows storage errors (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    expect(() => writeJsonStorage(KEY, 'whatever')).not.toThrow()
  })
})
