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
  })
})
