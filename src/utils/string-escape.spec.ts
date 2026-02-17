import { describe, expect, it } from 'vitest'

import { escapeString, unescapeString } from '@/utils/string-escape'

describe('string escape utilities', () => {
  describe('html', () => {
    it('should escape HTML entities', () => {
      expect(escapeString('<div class="test">&</div>', 'html')).toBe(
        '&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;',
      )
    })

    it('should unescape HTML entities', () => {
      expect(unescapeString('&lt;div&gt;&amp;&lt;/div&gt;', 'html')).toBe('<div>&</div>')
    })
  })

  describe('javascript', () => {
    it('should escape JS special characters', () => {
      expect(escapeString('hello\nworld\t"test"', 'javascript')).toBe('hello\\nworld\\t\\"test\\"')
    })

    it('should unescape JS special characters', () => {
      expect(unescapeString('hello\\nworld\\t\\"test\\"', 'javascript')).toBe('hello\nworld\t"test"')
    })
  })

  describe('json', () => {
    it('should escape JSON string', () => {
      expect(escapeString('hello\n"world"', 'json')).toBe('hello\\n\\"world\\"')
    })

    it('should unescape JSON string', () => {
      expect(unescapeString('hello\\n\\"world\\"', 'json')).toBe('hello\n"world"')
    })
  })

  describe('url', () => {
    it('should escape URL characters', () => {
      expect(escapeString('hello world&foo=bar', 'url')).toBe('hello%20world%26foo%3Dbar')
    })

    it('should unescape URL characters', () => {
      expect(unescapeString('hello%20world', 'url')).toBe('hello world')
    })
  })

  describe('xml', () => {
    it('should escape XML entities', () => {
      expect(escapeString('<tag attr="val">&</tag>', 'xml')).toBe('&lt;tag attr=&quot;val&quot;&gt;&amp;&lt;/tag&gt;')
    })

    it('should unescape XML entities', () => {
      expect(unescapeString('&lt;tag&gt;&amp;&lt;/tag&gt;', 'xml')).toBe('<tag>&</tag>')
    })
  })

  it('should handle empty strings', () => {
    expect(escapeString('', 'html')).toBe('')
    expect(unescapeString('', 'html')).toBe('')
  })
})
