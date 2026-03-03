import { describe, expect, it, vi } from 'vitest'

import { initializeMermaid, renderMermaid } from '@/utils/mermaid-renderer'

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn(),
    render: vi.fn(),
  },
}))

vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((svg: string) => svg),
  },
}))

describe('mermaid-renderer', () => {
  describe('initializeMermaid', () => {
    it('calls mermaid.initialize with expected config', async () => {
      const { default: mermaid } = await import('mermaid')
      initializeMermaid()
      expect(mermaid.initialize).toHaveBeenCalledWith({
        flowchart: { useMaxWidth: true },
        logLevel: 'error',
        securityLevel: 'strict',
        startOnLoad: false,
        suppressErrorRendering: true,
        theme: 'dark',
      })
    })

    it('only initializes once (idempotent)', async () => {
      const { default: mermaid } = await import('mermaid')
      // Ensure initialized flag is set (may already be from prior test)
      initializeMermaid()
      const callCount = vi.mocked(mermaid.initialize).mock.calls.length
      // Second call should be a no-op
      initializeMermaid()
      expect(vi.mocked(mermaid.initialize).mock.calls.length).toBe(callCount)
    })
  })

  describe('renderMermaid', () => {
    it('strips init directives before rendering', async () => {
      const { default: mermaid } = await import('mermaid')
      vi.mocked(mermaid.render).mockResolvedValue({
        diagramType: 'flowchart-v2',
        svg: '<svg></svg>',
      } as never)

      await renderMermaid('%%{init: {}}%%\nflowchart TD\n    A --> B', 'test-1')
      expect(vi.mocked(mermaid.render)).toHaveBeenCalledWith('test-1', 'flowchart TD\n    A --> B')
    })

    it('calls DOMPurify.sanitize on the SVG output', async () => {
      const { default: mermaid } = await import('mermaid')
      const { default: DOMPurify } = await import('dompurify')
      vi.mocked(mermaid.render).mockResolvedValue({
        diagramType: 'flowchart-v2',
        svg: '<svg>test</svg>',
      } as never)

      await renderMermaid('flowchart TD\n    A --> B', 'test-2')
      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<svg>test</svg>', {
        USE_PROFILES: { svg: true, svgFilters: true },
      })
    })

    it('returns sanitized SVG and diagramType', async () => {
      const { default: mermaid } = await import('mermaid')
      vi.mocked(mermaid.render).mockResolvedValue({
        diagramType: 'sequence',
        svg: '<svg>seq</svg>',
      } as never)

      const result = await renderMermaid('sequenceDiagram\n    Alice->>Bob: Hello', 'test-3')
      expect(result).toEqual({ diagramType: 'sequence', svg: '<svg>seq</svg>' })
    })

    it('throws on empty input', async () => {
      await expect(renderMermaid('', 'test-4')).rejects.toThrow('Empty diagram input')
    })

    it('throws on input that becomes empty after sanitization', async () => {
      await expect(renderMermaid('%%{init: {}}%%', 'test-5')).rejects.toThrow('Empty diagram input')
    })

    it('propagates error when mermaid.render rejects', async () => {
      const { default: mermaid } = await import('mermaid')
      vi.mocked(mermaid.render).mockRejectedValue(new Error('Parse error on line 1'))

      await expect(renderMermaid('invalid diagram code', 'test-6')).rejects.toThrow('Parse error on line 1')
    })
  })
})
