// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

const mockPipeline = vi.fn()
const mockFromBlob = vi.fn()

vi.mock('@huggingface/transformers', () => ({
  RawImage: { fromBlob: mockFromBlob },
  pipeline: mockPipeline,
}))

const { applyBackground, removeBackground, resetPipelineCache } = await import('./background-removal')

function createMockCanvas() {
  const drawImageCalls: Array<unknown> = []
  const fillRectCalls: Array<unknown> = []
  let fillStyleValue = ''

  const mockCtx = {
    drawImage: (...args: Array<unknown>) => drawImageCalls.push(args),
    fillRect: (...args: Array<unknown>) => fillRectCalls.push(args),
    putImageData: vi.fn(),
    set fillStyle(v: string) {
      fillStyleValue = v
    },
    get fillStyle() {
      return fillStyleValue
    },
  }

  const canvas = {
    getContext: () => mockCtx,
    height: 0,
    toBlob: (cb: (blob: Blob | null) => void) => {
      // Auto-resolve with a PNG blob
      cb(new Blob(['mock-png'], { type: 'image/png' }))
    },
    width: 0,
  }

  return {
    canvas,
    drawImageCalls,
    fillRectCalls,
    get fillStyleValue() {
      return fillStyleValue
    },
  }
}

function mockDocumentCreateElement(canvasMock: { canvas: unknown }) {
  const origCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
    if (tag === 'canvas') return canvasMock.canvas as HTMLCanvasElement
    return origCreate(tag, options)
  })
}

function stubImageConstructor(behavior: 'load' | 'error', width = 200, height = 100) {
  class MockImage {
    width = width
    height = height
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      setTimeout(() => {
        if (behavior === 'load') this.onload?.()
        else this.onerror?.()
      }, 0)
    }
  }
  vi.stubGlobal('Image', MockImage)
}

// jsdom doesn't provide ImageData, stub it
class MockImageData {
  data: Uint8ClampedArray
  width: number
  height: number
  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data
    this.width = width
    this.height = height
  }
}

if (typeof globalThis.ImageData === 'undefined') {
  vi.stubGlobal('ImageData', MockImageData)
}

describe('background-removal utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPipeline.mockClear()
    mockFromBlob.mockClear()
    resetPipelineCache()
  })

  describe('applyBackground', () => {
    it('composites foreground onto a colored background', async () => {
      const mock = createMockCanvas()
      mockDocumentCreateElement(mock)
      stubImageConstructor('load')

      const foreground = new Blob(['fake'], { type: 'image/png' })
      const result = await applyBackground(foreground, '#ff0000')

      expect(result).toBeInstanceOf(Blob)
      expect(mock.fillStyleValue).toBe('#ff0000')
      expect(mock.fillRectCalls).toHaveLength(1)
      expect(mock.drawImageCalls).toHaveLength(1)
      expect(mock.canvas.width).toBe(200)
      expect(mock.canvas.height).toBe(100)
    })

    it('rejects for non-image blobs', async () => {
      const blob = new Blob(['text'], { type: 'text/plain' })
      await expect(applyBackground(blob, '#fff')).rejects.toThrow('Invalid foreground image')
    })

    it('revokes object URL even on error', async () => {
      stubImageConstructor('error')
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')

      const foreground = new Blob(['fake'], { type: 'image/png' })
      await expect(applyBackground(foreground, '#fff')).rejects.toThrow('Failed to load foreground image')
      expect(revokeSpy).toHaveBeenCalled()
    })
  })

  describe('removeBackground', () => {
    it('rejects for non-image blobs', async () => {
      const blob = new Blob(['text'], { type: 'text/plain' })
      await expect(removeBackground(blob)).rejects.toThrow('Please select an image file')
    })

    it('calls the pipeline and returns a Blob', async () => {
      const mock = createMockCanvas()
      mockDocumentCreateElement(mock)

      const mockSegmenter = vi.fn().mockResolvedValue({
        data: new Uint8ClampedArray(4 * 2 * 2),
        height: 2,
        width: 2,
      })
      mockPipeline.mockResolvedValue(mockSegmenter)
      mockFromBlob.mockResolvedValue('raw-image')

      const blob = new Blob(['fake'], { type: 'image/png' })
      const result = await removeBackground(blob)

      expect(result).toBeInstanceOf(Blob)
      expect(mockSegmenter).toHaveBeenCalledWith('raw-image')
    })

    it('caches the pipeline singleton', async () => {
      const mock = createMockCanvas()
      mockDocumentCreateElement(mock)

      const mockSegmenter = vi.fn().mockResolvedValue({
        data: new Uint8ClampedArray(4 * 2 * 2),
        height: 2,
        width: 2,
      })
      mockPipeline.mockResolvedValue(mockSegmenter)
      mockFromBlob.mockResolvedValue('raw-image')

      const blob = new Blob(['fake'], { type: 'image/png' })

      await removeBackground(blob)
      await removeBackground(blob)

      expect(mockPipeline).toHaveBeenCalledTimes(1)
    })
  })
})
