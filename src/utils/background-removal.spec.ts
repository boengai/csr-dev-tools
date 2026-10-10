// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BgRemovalResult, BgRemovalWorkerRequest } from '@/types/utils/background-removal'
import type { WorkerRequest, WorkerResponse } from '@/types/wasm/worker-bridge'

import { applyBackground, removeBackground } from './background-removal'

type Listener = (e: { data: WorkerResponse<BgRemovalResult>; type: string }) => void

// Fake worker: records requests and lets each test script the reply
// (progress envelopes, then a result or error), standing in for
// src/workers/background-removal.worker.ts.
let respond: (req: WorkerRequest<BgRemovalWorkerRequest>, emit: (r: WorkerResponse<BgRemovalResult>) => void) => void
const requests: Array<{ req: WorkerRequest<BgRemovalWorkerRequest>; transfer: Array<Transferable> }> = []
class FakeWorker {
  listeners = new Set<Listener>()
  addEventListener(type: string, l: Listener) {
    if (type === 'message') this.listeners.add(l)
  }
  removeEventListener() {}
  postMessage(req: WorkerRequest<BgRemovalWorkerRequest>, transfer: Array<Transferable>) {
    requests.push({ req, transfer })
    queueMicrotask(() =>
      respond(req, (data) => {
        for (const l of this.listeners) l({ data, type: 'message' })
      }),
    )
  }
  terminate() {}
}

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
      await expect(applyBackground(foreground, '#fff')).rejects.toThrow(/Image loading failed/)
      expect(revokeSpy).toHaveBeenCalled()
    })
  })

  describe('removeBackground', () => {
    beforeEach(() => {
      requests.length = 0
      vi.stubGlobal('Worker', FakeWorker)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      if (typeof globalThis.ImageData === 'undefined') vi.stubGlobal('ImageData', MockImageData)
    })

    it('rejects for non-image blobs without contacting the worker', async () => {
      const blob = new Blob(['text'], { type: 'text/plain' })
      await expect(removeBackground(blob)).rejects.toThrow('Please select an image file')
      expect(requests).toHaveLength(0)
    })

    it('transfers the image bytes to the worker and paints the returned RGBA into a PNG blob', async () => {
      const mock = createMockCanvas()
      mockDocumentCreateElement(mock)
      respond = (req, emit) => emit({ id: req.id, result: { height: 2, rgba: new ArrayBuffer(16), width: 2 } })

      const blob = new Blob(['fake'], { type: 'image/png' })
      const result = await removeBackground(blob)

      expect(result).toBeInstanceOf(Blob)
      expect(requests[0].req.type).toBe('image/png')
      expect(requests[0].req.bytes.byteLength).toBe(4)
      expect(requests[0].transfer).toEqual([requests[0].req.bytes])
      expect(mock.canvas.width).toBe(2)
      expect(mock.canvas.height).toBe(2)
    })

    it('forwards worker progress envelopes to onProgress', async () => {
      const mock = createMockCanvas()
      mockDocumentCreateElement(mock)
      respond = (req, emit) => {
        emit({ id: req.id, progress: 30 })
        emit({ id: req.id, progress: 90 })
        emit({ id: req.id, result: { height: 1, rgba: new ArrayBuffer(4), width: 1 } })
      }

      const progressFn = vi.fn()
      await removeBackground(new Blob(['fake'], { type: 'image/png' }), progressFn)

      expect(progressFn.mock.calls).toEqual([[30], [90]])
    })

    it('rejects with the worker error message', async () => {
      respond = (req, emit) => emit({ id: req.id, error: 'model fetch failed' })
      await expect(removeBackground(new Blob(['fake'], { type: 'image/png' }))).rejects.toThrow('model fetch failed')
    })
  })
})
