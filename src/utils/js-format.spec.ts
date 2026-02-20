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

    it('should preserve URLs inside string literals', () => {
      const result = minifyJs('var url = "http://example.com";')
      expect(result).toContain('"http://example.com"')
    })

    it('should preserve comment-like content inside strings', () => {
      const result = minifyJs("var s = '/* not a comment */';")
      expect(result).toContain("'/* not a comment */'")
    })

    it('should replace newlines with spaces to preserve statement separation', () => {
      const result = minifyJs('var a = 1;\nvar b = 2;')
      expect(result).toContain('var a = 1; var b = 2;')
    })
  })
})
