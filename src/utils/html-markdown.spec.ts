import { describe, expect, it } from 'vitest'

import { htmlToMarkdown, markdownToHtml } from '@/utils/html-markdown'

describe('html-markdown conversion utilities', () => {
  describe('htmlToMarkdown', () => {
    it('should convert headings', async () => {
      const result = await htmlToMarkdown('<h1>Hello</h1>')
      expect(result).toContain('# Hello')
    })

    it('should convert paragraphs with bold and italic', async () => {
      const result = await htmlToMarkdown('<p><strong>bold</strong> and <em>italic</em></p>')
      expect(result).toContain('**bold**')
      expect(result).toContain('_italic_')
    })

    it('should convert links', async () => {
      const result = await htmlToMarkdown('<a href="https://example.com">link</a>')
      expect(result).toContain('[link](https://example.com)')
    })

    it('should convert images', async () => {
      const result = await htmlToMarkdown('<img src="test.png" alt="Test image">')
      expect(result).toContain('![Test image](test.png)')
    })

    it('should convert tables to GFM markdown', async () => {
      const html =
        '<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>John</td><td>30</td></tr></tbody></table>'
      const result = await htmlToMarkdown(html)
      expect(result).toContain('| Name | Age |')
      expect(result).toContain('| John | 30 |')
    })

    it('should throw on empty string', async () => {
      await expect(htmlToMarkdown('')).rejects.toThrow('Empty input')
    })
  })

  describe('markdownToHtml', () => {
    it('should convert headings', async () => {
      const result = await markdownToHtml('# Hello')
      expect(result).toContain('<h1>Hello</h1>')
    })

    it('should convert bold and italic', async () => {
      const result = await markdownToHtml('**bold** and *italic*')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<em>italic</em>')
    })

    it('should convert links', async () => {
      const result = await markdownToHtml('[link](https://example.com)')
      expect(result).toContain('<a href="https://example.com">link</a>')
    })

    it('should throw on empty string', async () => {
      await expect(markdownToHtml('')).rejects.toThrow('Empty input')
    })

    it('should strip script tags from output', async () => {
      const result = await markdownToHtml('hello <script>alert("xss")</script> world')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should strip event handlers from output', async () => {
      const result = await markdownToHtml('<div onload="alert(1)">test</div>')
      expect(result).not.toContain('onload')
    })

    it('should neutralize javascript: URIs', async () => {
      const result = await markdownToHtml('[click](javascript:alert(1))')
      expect(result).not.toContain('javascript:')
    })
  })
})
