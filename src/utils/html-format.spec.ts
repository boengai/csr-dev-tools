import { describe, expect, it } from 'vitest'

import { formatHtml, minifyHtml } from '@/utils/html-format'

describe('html formatting utilities', () => {
  describe('formatHtml', () => {
    it('should format minified HTML with 2-space indent', () => {
      const result = formatHtml('<div><p>hello</p></div>')
      expect(result).toContain('  <p>')
    })

    it('should format with 4-space indent', () => {
      const result = formatHtml('<div><p>hello</p></div>', 4)
      expect(result).toContain('    <p>')
    })

    it('should format with tab indent', () => {
      const result = formatHtml('<div><p>hello</p></div>', 'tab')
      expect(result).toContain('\t<p>')
    })

    it('should return empty string for empty input', () => {
      expect(formatHtml('')).toBe('')
      expect(formatHtml('   ')).toBe('')
    })
  })

  describe('minifyHtml', () => {
    it('should remove whitespace between tags', () => {
      const result = minifyHtml('<div>\n  <p>hello</p>\n</div>')
      expect(result).toBe('<div><p>hello</p></div>')
    })

    it('should remove HTML comments', () => {
      const result = minifyHtml('<div><!-- comment --><p>hi</p></div>')
      expect(result).toBe('<div><p>hi</p></div>')
    })

    it('should return empty string for empty input', () => {
      expect(minifyHtml('')).toBe('')
    })
  })
})
