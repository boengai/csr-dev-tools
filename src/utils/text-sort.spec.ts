import { describe, expect, it } from 'vitest'

import { DEFAULT_SORT_OPTIONS, sortAndProcessText } from './text-sort'

describe('sortAndProcessText', () => {
  it('sorts A-Z', () => {
    const result = sortAndProcessText('cherry\napple\nbanana', DEFAULT_SORT_OPTIONS)
    expect(result.output).toBe('apple\nbanana\ncherry')
  })

  it('sorts Z-A', () => {
    const result = sortAndProcessText('cherry\napple\nbanana', { ...DEFAULT_SORT_OPTIONS, sortMode: 'za' })
    expect(result.output).toBe('cherry\nbanana\napple')
  })

  it('sorts by length ascending', () => {
    const result = sortAndProcessText('bb\naaa\nc', { ...DEFAULT_SORT_OPTIONS, sortMode: 'length-asc' })
    expect(result.output).toBe('c\nbb\naaa')
  })

  it('sorts by length descending', () => {
    const result = sortAndProcessText('bb\naaa\nc', { ...DEFAULT_SORT_OPTIONS, sortMode: 'length-desc' })
    expect(result.output).toBe('aaa\nbb\nc')
  })

  it('sorts numerically', () => {
    const result = sortAndProcessText('10\n2\n1\n20', { ...DEFAULT_SORT_OPTIONS, sortMode: 'numeric' })
    expect(result.output).toBe('1\n2\n10\n20')
  })

  it('removes duplicates', () => {
    const result = sortAndProcessText('a\nb\na\nc\nb', { ...DEFAULT_SORT_OPTIONS, removeDuplicates: true })
    expect(result.output).toBe('a\nb\nc')
  })

  it('removes empty lines', () => {
    const result = sortAndProcessText('a\n\nb\n\nc', { ...DEFAULT_SORT_OPTIONS, removeEmpty: true })
    expect(result.output).toBe('a\nb\nc')
  })

  it('trims whitespace', () => {
    const result = sortAndProcessText('  a  \n  b  ', { ...DEFAULT_SORT_OPTIONS, trimLines: true })
    expect(result.output).toBe('a\nb')
  })

  it('returns line counts', () => {
    const result = sortAndProcessText('a\nb\na\n\nc', {
      ...DEFAULT_SORT_OPTIONS,
      removeDuplicates: true,
      removeEmpty: true,
    })
    expect(result.lineCountBefore).toBe(5)
    expect(result.lineCountAfter).toBe(3)
  })

  it('handles numeric sort with non-numeric lines', () => {
    const result = sortAndProcessText('10\nhello\n2\nworld', { ...DEFAULT_SORT_OPTIONS, sortMode: 'numeric' })
    expect(result.output).toBe('2\n10\nhello\nworld')
  })
})
