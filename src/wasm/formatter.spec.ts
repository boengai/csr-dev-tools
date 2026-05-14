import { describe, expect, it } from 'vitest'

import { formatCss, formatHtml, formatJs, formatSql, minifyCss, minifyHtml, minifyJs } from './formatter'

describe('formatter wasm bridge', () => {
  describe('formatCss', () => {
    it('should format minified CSS', async () => {
      const result = await formatCss('body{color:red;margin:0}')
      expect(result).toContain('  color: red;')
    })

    it('should format with 4-space indent', async () => {
      const result = await formatCss('body{color:red}', 4)
      expect(result).toContain('    color: red')
    })

    it('should return empty string for empty input', async () => {
      expect(await formatCss('')).toBe('')
    })
  })

  describe('minifyCss', () => {
    it('should minify CSS', async () => {
      const result = await minifyCss('body {\n  color: red;\n  margin: 0;\n}')
      expect(result).toBe('body{color:red;margin:0}')
    })

    it('should remove comments', async () => {
      const result = await minifyCss('/* comment */body { color: red; }')
      expect(result).not.toContain('comment')
    })

    it('should return empty string for empty input', async () => {
      expect(await minifyCss('')).toBe('')
    })

    it('should preserve content inside CSS string literals', async () => {
      const result = await minifyCss('.foo { content: "hello { world }"; }')
      expect(result).toContain('"hello { world }"')
    })

    it('should preserve quoted URLs with special characters', async () => {
      const result = await minifyCss('.bar { background: url("data:image/svg+xml;base64,abc"); }')
      expect(result).toContain('"data:image/svg+xml;base64,abc"')
    })
  })

  describe('formatHtml', () => {
    it('should format minified HTML with 2-space indent', async () => {
      const result = await formatHtml('<div><p>hello</p></div>')
      expect(result).toContain('  <p>')
    })

    it('should format with 4-space indent', async () => {
      const result = await formatHtml('<div><p>hello</p></div>', 4)
      expect(result).toContain('    <p>')
    })

    it('should format with tab indent', async () => {
      const result = await formatHtml('<div><p>hello</p></div>', 'tab')
      expect(result).toContain('\t<p>')
    })

    it('should return empty string for empty input', async () => {
      expect(await formatHtml('')).toBe('')
      expect(await formatHtml('   ')).toBe('')
    })
  })

  describe('minifyHtml', () => {
    it('should remove whitespace between tags', async () => {
      const result = await minifyHtml('<div>\n  <p>hello</p>\n</div>')
      expect(result).toBe('<div><p>hello</p></div>')
    })

    it('should remove HTML comments', async () => {
      const result = await minifyHtml('<div><!-- comment --><p>hi</p></div>')
      expect(result).toBe('<div><p>hi</p></div>')
    })

    it('should return empty string for empty input', async () => {
      expect(await minifyHtml('')).toBe('')
    })

    it('should preserve whitespace inside <pre> tags', async () => {
      const result = await minifyHtml('<div>\n  <pre>\n    code here\n  </pre>\n</div>')
      expect(result).toContain('<pre>\n    code here\n  </pre>')
    })

    it('should preserve whitespace inside <script> tags', async () => {
      const result = await minifyHtml('<div>\n  <script>\n    const x = 1;\n  </script>\n</div>')
      expect(result).toContain('<script>\n    const x = 1;\n  </script>')
    })

    it('should preserve whitespace inside <style> tags', async () => {
      const result = await minifyHtml('<div>\n  <style>\n    .foo { color: red; }\n  </style>\n</div>')
      expect(result).toContain('<style>\n    .foo { color: red; }\n  </style>')
    })

    it('should preserve whitespace inside <code> tags', async () => {
      const result = await minifyHtml('<div>\n  <code>  spaced  text  </code>\n</div>')
      expect(result).toContain('<code>  spaced  text  </code>')
    })

    it('should handle self-closing tags', async () => {
      const result = await minifyHtml('<div>\n  <br />\n  <img src="test.png" />\n</div>')
      expect(result).toContain('<br />')
      expect(result).toContain('<img src="test.png" />')
    })

    it('should handle nested attributes with quotes', async () => {
      const result = await minifyHtml('<div class="foo bar"  data-x="hello">\n  <p>hi</p>\n</div>')
      expect(result).toBe('<div class="foo bar" data-x="hello"><p>hi</p></div>')
    })
  })

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

  describe('formatSql', () => {
    it('should format a simple SELECT', async () => {
      const result = await formatSql('select id, name from users where id = 1')
      expect(result).toContain('SELECT')
      expect(result).toContain('FROM')
      expect(result).toContain('WHERE')
    })

    it('should support different dialects', async () => {
      const result = await formatSql('select * from users limit 10', 'mysql')
      expect(result).toContain('SELECT')
    })

    it('should return empty string for empty input', async () => {
      expect(await formatSql('')).toBe('')
    })
  })
})
