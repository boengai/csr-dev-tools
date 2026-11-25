import { describe, expect, it } from 'vitest'

import { restoreJson } from './restore-json'

describe('restoreJson', () => {
  const formatter = { indent: 2 as number | 'tab', mode: 'beautify', source: '' }

  it.each([[null], [42], ['str'], [true], [[]], [[7]]])('%j in place of a bag gives the default', (stored) => {
    expect(restoreJson(stored, formatter)).toEqual(formatter)
  })

  it.each([[null], [42], [{}], [[]], [true]])('%j in place of text gives the default', (stored) => {
    expect(restoreJson(stored, '')).toBe('')
  })

  it('keeps every good field beside a bad or missing one', () => {
    expect(restoreJson({ indent: 4, source: 7 }, formatter)).toEqual({ indent: 4, mode: 'beautify', source: '' })
  })

  it('keeps text stored for a number', () => {
    expect(restoreJson({ ...formatter, indent: 'tab' }, formatter).indent).toBe('tab')
  })

  it.each([false, null, {}])('%j in place of a number gives the default', (indent) => {
    expect(restoreJson({ ...formatter, indent }, formatter).indent).toBe(2)
  })

  it('keeps fields the default does not name, at every depth', () => {
    const stored = { hour: { interval: 2, mode: 'interval' }, later: 1 }
    expect(restoreJson(stored, { hour: { mode: 'every' } })).toEqual(stored)
  })

  it('drops only the list items that differ from the first default item', () => {
    expect(restoreJson(['UTC', 7, null, 'Asia/Tokyo'], ['Europe/London'])).toEqual(['UTC', 'Asia/Tokyo'])
    expect(restoreJson([{ id: 'a' }, 7, {}], [{ id: '', n: 0 }])).toEqual([
      { id: 'a', n: 0 },
      { id: '', n: 0 },
    ])
    expect(restoreJson([], ['UTC'])).toEqual([])
  })

  it('reads an empty default list as a list of text', () => {
    expect(restoreJson(['UTC', 7, {}], [])).toEqual(['UTC'])
  })

  it('returns the default itself when nothing is stored', () => {
    expect(restoreJson(undefined, formatter)).toBe(formatter)
  })
})
