import { describe, expect, it } from 'vitest'

import { optimizeSvg, sanitizeSvg } from '@/utils/svg-optimize'

describe('svg-optimize utilities', () => {
  describe('sanitizeSvg', () => {
    it('should remove script tags', () => {
      const input = '<svg><script>alert("xss")</script><rect/></svg>'
      expect(sanitizeSvg(input)).toBe('<svg><rect/></svg>')
    })

    it('should remove self-closing script tags', () => {
      const input = '<svg><script src="evil.js"/><rect/></svg>'
      expect(sanitizeSvg(input)).toBe('<svg><rect/></svg>')
    })

    it('should remove event handlers', () => {
      const input = '<svg><rect onclick="alert(1)" onload="evil()"/></svg>'
      const result = sanitizeSvg(input)
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('onload')
    })

    it('should remove foreignObject elements', () => {
      const input = '<svg><foreignObject><div>html</div></foreignObject><rect/></svg>'
      expect(sanitizeSvg(input)).toBe('<svg><rect/></svg>')
    })

    it('should preserve safe SVG content', () => {
      const input = '<svg><rect width="100" height="100" fill="red"/></svg>'
      expect(sanitizeSvg(input)).toBe(input)
    })
  })

  describe('optimizeSvg', () => {
    it('should remove XML declaration', () => {
      const input = '<?xml version="1.0" encoding="UTF-8"?><svg><rect/></svg>'
      const { optimized } = optimizeSvg(input)
      expect(optimized).not.toContain('<?xml')
    })

    it('should remove comments', () => {
      const input = '<svg><!-- comment --><rect/></svg>'
      const { optimized } = optimizeSvg(input)
      expect(optimized).not.toContain('comment')
    })

    it('should remove metadata', () => {
      const input = '<svg><metadata><rdf:RDF>data</rdf:RDF></metadata><rect/></svg>'
      const { optimized } = optimizeSvg(input)
      expect(optimized).not.toContain('metadata')
    })

    it('should remove empty attributes', () => {
      const input = '<svg><rect class="" id="" fill="red"/></svg>'
      const { optimized } = optimizeSvg(input)
      expect(optimized).not.toContain('class=""')
      expect(optimized).toContain('fill="red"')
    })

    it('should collapse whitespace', () => {
      const input = '<svg>   <rect/>   </svg>'
      const { optimized } = optimizeSvg(input)
      expect(optimized).toBe('<svg><rect/></svg>')
    })

    it('should report correct sizes and savings', () => {
      const input = '<?xml version="1.0"?>\n<svg>  <!-- comment -->  <rect/>  </svg>'
      const result = optimizeSvg(input)
      expect(result.originalSize).toBeGreaterThan(result.optimizedSize)
      expect(result.savings).toContain('bytes')
      expect(result.savings).toContain('%')
    })

    it('should handle empty string', () => {
      const result = optimizeSvg('')
      expect(result.optimized).toBe('')
      expect(result.originalSize).toBe(0)
      expect(result.optimizedSize).toBe(0)
    })
  })
})
