import { describe, expect, it } from 'vitest'

import { countTextStats } from '@/utils/word-counter'

describe('word counter utilities', () => {
  it('should return zeros for empty string', () => {
    const stats = countTextStats('')
    expect(stats.characters).toBe(0)
    expect(stats.words).toBe(0)
    expect(stats.sentences).toBe(0)
    expect(stats.paragraphs).toBe(0)
    expect(stats.lines).toBe(0)
  })

  it('should count characters correctly', () => {
    const stats = countTextStats('hello world')
    expect(stats.characters).toBe(11)
    expect(stats.charactersNoSpaces).toBe(10)
  })

  it('should count words correctly', () => {
    const stats = countTextStats('hello world test')
    expect(stats.words).toBe(3)
  })

  it('should count sentences correctly', () => {
    const stats = countTextStats('Hello world. This is a test. Great!')
    expect(stats.sentences).toBe(3)
  })

  it('should count paragraphs correctly', () => {
    const stats = countTextStats('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.')
    expect(stats.paragraphs).toBe(3)
  })

  it('should count lines correctly', () => {
    const stats = countTextStats('line 1\nline 2\nline 3')
    expect(stats.lines).toBe(3)
  })

  it('should calculate reading time', () => {
    const words = Array.from({ length: 400 }, () => 'word').join(' ')
    const stats = countTextStats(words)
    expect(stats.readingTime).toBe('2 min')
  })

  it('should handle whitespace-only input', () => {
    const stats = countTextStats('   ')
    expect(stats.words).toBe(0)
  })
})
