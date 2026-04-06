import { describe, expect, it } from 'vitest'

import { formatCss, minifyCss } from '@/utils'

describe('css formatting utilities', () => {
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
})
