import { describe, expect, it } from 'vitest'

import { formatJs, minifyJs } from '@/utils/js-format'

describe('js formatting utilities', () => {
  describe('formatJs', () => {
    it('should format minified JS', () => {
      const result = formatJs('function foo(){return 1}')
      expect(result).toContain('  return 1')
    })

    it('should return empty string for empty input', () => {
      expect(formatJs('')).toBe('')
    })
  })

  describe('minifyJs', () => {
    it('should remove line comments', () => {
      const result = minifyJs('var a = 1; // comment\nvar b = 2;')
      expect(result).not.toContain('comment')
    })

    it('should remove block comments', () => {
      const result = minifyJs('/* block */var a = 1;')
      expect(result).not.toContain('block')
    })

    it('should return empty string for empty input', () => {
      expect(minifyJs('')).toBe('')
    })
  })
})
