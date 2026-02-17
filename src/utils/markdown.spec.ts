import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '@/utils/markdown'

describe('markdown utilities', () => {
  describe('renderMarkdown', () => {
    it('should render headings', () => {
      const result = renderMarkdown('# Hello')
      expect(result).toContain('<h1')
      expect(result).toContain('Hello')
    })

    it('should render bold text', () => {
      const result = renderMarkdown('**bold**')
      expect(result).toContain('<strong>')
    })

    it('should render links', () => {
      const result = renderMarkdown('[link](https://example.com)')
      expect(result).toContain('<a ')
      expect(result).toContain('https://example.com')
    })

    it('should strip script tags', () => {
      const result = renderMarkdown('<script>alert("xss")</script>')
      expect(result).not.toContain('<script')
    })

    it('should strip event handlers', () => {
      const result = renderMarkdown('<div onload="alert(1)">test</div>')
      expect(result).not.toContain('onload')
    })

    it('should return empty string for empty input', () => {
      expect(renderMarkdown('')).toBe('')
      expect(renderMarkdown('   ')).toBe('')
    })
  })
})
