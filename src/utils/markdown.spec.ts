import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '@/utils'

describe('markdown utilities', () => {
  describe('renderMarkdown', () => {
    it('should render headings', async () => {
      const result = await renderMarkdown('# Hello')
      expect(result).toContain('<h1')
      expect(result).toContain('Hello')
    })

    it('should render bold text', async () => {
      const result = await renderMarkdown('**bold**')
      expect(result).toContain('<strong>')
    })

    it('should render links', async () => {
      const result = await renderMarkdown('[link](https://example.com)')
      expect(result).toContain('<a ')
      expect(result).toContain('https://example.com')
    })

    it('should strip script tags', async () => {
      const result = await renderMarkdown('<script>alert("xss")</script>')
      expect(result).not.toContain('<script')
    })

    it('should strip event handlers', async () => {
      const result = await renderMarkdown('<div onload="alert(1)">test</div>')
      expect(result).not.toContain('onload')
    })

    it('should strip event handlers after slash delimiter (svg/onload)', async () => {
      const result = await renderMarkdown('<svg/onload=alert(1)>')
      expect(result).not.toContain('onload')
    })

    it('should strip javascript: URIs in src attributes', async () => {
      const result = await renderMarkdown('<img src="javascript:alert(1)">')
      expect(result).not.toContain('javascript:')
    })

    it('should strip form tags', async () => {
      const result = await renderMarkdown('<form action="https://evil.com"><input></form>')
      expect(result).not.toContain('<form')
    })

    it('should strip base tags', async () => {
      const result = await renderMarkdown('<base href="https://evil.com">')
      expect(result).not.toContain('<base')
    })

    it('should return empty string for empty input', async () => {
      expect(await renderMarkdown('')).toBe('')
      expect(await renderMarkdown('   ')).toBe('')
    })
  })
})
