import { describe, expect, it } from 'vitest'

import { optimizeSvg } from '@/utils'

describe('svg-optimize utilities', () => {
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
