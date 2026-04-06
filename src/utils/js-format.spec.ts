import { describe, expect, it } from 'vitest'

import { formatJs, minifyJs } from '@/utils'

describe('js formatting utilities', () => {
  describe('formatJs', () => {
    it('should format minified JS', async () => {
      const result = await formatJs('function foo(){return 1}')
      expect(result).toContain('  return 1')
    })

    it('should return empty string for empty input', async () => {
      expect(await formatJs('')).toBe('')
    })
  })

  describe('minifyJs', () => {
    it('should remove line comments', async () => {
      const result = await minifyJs('var a = 1; // comment\nvar b = 2;')
      expect(result).not.toContain('comment')
    })

    it('should remove block comments', async () => {
      const result = await minifyJs('/* block */var a = 1;')
      expect(result).not.toContain('block')
    })

    it('should return empty string for empty input', async () => {
      expect(await minifyJs('')).toBe('')
    })

    it('should preserve URLs inside string literals', async () => {
      const result = await minifyJs('var url = "http://example.com";')
      expect(result).toContain('"http://example.com"')
    })

    it('should preserve comment-like content inside strings', async () => {
      const result = await minifyJs("var s = '/* not a comment */';")
      expect(result).toContain("'/* not a comment */'")
    })

    it('should replace newlines with spaces to preserve statement separation', async () => {
      const result = await minifyJs('var a = 1;\nvar b = 2;')
      expect(result).toContain('var a = 1; var b = 2;')
    })
  })
})
