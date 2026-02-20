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

    it('should preserve whitespace inside <pre> tags', () => {
      const result = minifyHtml('<div>\n  <pre>\n    code here\n  </pre>\n</div>')
      expect(result).toContain('<pre>\n    code here\n  </pre>')
    })

    it('should preserve whitespace inside <script> tags', () => {
      const result = minifyHtml('<div>\n  <script>\n    const x = 1;\n  </script>\n</div>')
      expect(result).toContain('<script>\n    const x = 1;\n  </script>')
    })

    it('should preserve whitespace inside <style> tags', () => {
      const result = minifyHtml('<div>\n  <style>\n    .foo { color: red; }\n  </style>\n</div>')
      expect(result).toContain('<style>\n    .foo { color: red; }\n  </style>')
    })

    it('should preserve whitespace inside <code> tags', () => {
      const result = minifyHtml('<div>\n  <code>  spaced  text  </code>\n</div>')
      expect(result).toContain('<code>  spaced  text  </code>')
    })

    it('should handle self-closing tags', () => {
      const result = minifyHtml('<div>\n  <br />\n  <img src="test.png" />\n</div>')
      expect(result).toContain('<br />')
      expect(result).toContain('<img src="test.png" />')
    })

    it('should handle nested attributes with quotes', () => {
      const result = minifyHtml('<div class="foo bar"  data-x="hello">\n  <p>hi</p>\n</div>')
      expect(result).toBe('<div class="foo bar" data-x="hello"><p>hi</p></div>')
    })
  })
})
