import { describe, expect, it } from 'vitest'

import { generateLoremIpsum } from '@/utils/lorem-ipsum'

describe('lorem ipsum utilities', () => {
  it('should return empty string for count 0', () => {
    expect(generateLoremIpsum(0, 'paragraphs', false)).toBe('')
  })

  it('should generate correct number of words', () => {
    const result = generateLoremIpsum(10, 'words', false)
    expect(result.split(' ')).toHaveLength(10)
  })

  it('should generate correct number of paragraphs', () => {
    const result = generateLoremIpsum(3, 'paragraphs', false)
    expect(result.split('\n\n')).toHaveLength(3)
  })

  it('should start with Lorem ipsum when enabled', () => {
    const result = generateLoremIpsum(1, 'paragraphs', true)
    expect(result.startsWith('Lorem ipsum dolor sit amet')).toBe(true)
  })

  it('should not prepend Lorem ipsum opener when disabled', () => {
    const result = generateLoremIpsum(1, 'paragraphs', false)
    expect(result.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit')).toBe(false)
  })

  it('should generate sentences', () => {
    const result = generateLoremIpsum(3, 'sentences', false)
    const sentences = result.split('.').filter((s) => s.trim().length > 0)
    expect(sentences.length).toBeGreaterThanOrEqual(3)
  })

  it('should start words with Lorem ipsum when enabled and enough words', () => {
    const result = generateLoremIpsum(10, 'words', true)
    expect(result.startsWith('Lorem ipsum dolor sit amet')).toBe(true)
  })
})
