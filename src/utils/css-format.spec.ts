import { describe, expect, it } from 'vitest'

import { formatCss, minifyCss } from '@/utils/css-format'

describe('css formatting utilities', () => {
  describe('formatCss', () => {
    it('should format minified CSS', () => {
      const result = formatCss('body{color:red;margin:0}')
      expect(result).toContain('  color: red;')
    })

    it('should format with 4-space indent', () => {
      const result = formatCss('body{color:red}', 4)
      expect(result).toContain('    color: red')
    })

    it('should return empty string for empty input', () => {
      expect(formatCss('')).toBe('')
    })
  })

  describe('minifyCss', () => {
    it('should minify CSS', () => {
      const result = minifyCss('body {\n  color: red;\n  margin: 0;\n}')
      expect(result).not.toContain('\n')
    })

    it('should remove comments', () => {
      const result = minifyCss('/* comment */body { color: red; }')
      expect(result).not.toContain('comment')
    })

    it('should return empty string for empty input', () => {
      expect(minifyCss('')).toBe('')
    })
  })
})
