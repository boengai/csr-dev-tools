import { afterEach, describe, expect, it, vi } from 'vitest'

import { nth } from '@/test/nth'

const mockPipeline = vi.hoisted(() => vi.fn())
const mockFromBlob = vi.hoisted(() => vi.fn())

vi.mock('@huggingface/transformers', () => ({
  RawImage: { fromBlob: mockFromBlob },
  pipeline: mockPipeline,
}))

const { resetSegmenterCache, segmentImage } = await import('./background-removal.segment')

type ProgressCallback = (info: { progress?: number; status?: string }) => void

const capturedProgressCallback = (): ProgressCallback =>
  (nth(mockPipeline.mock.calls, 0)[2] as { progress_callback: ProgressCallback }).progress_callback

const segmenterReturning = (width: number, height: number) =>
  vi.fn().mockResolvedValue({ data: new Uint8ClampedArray(width * height * 4).fill(7), height, width })

const bytes = () => new Uint8Array([1, 2, 3]).buffer

describe('segmentImage', () => {
  afterEach(() => {
    mockPipeline.mockReset()
    mockFromBlob.mockReset()
    resetSegmenterCache()
  })

  it('runs the modnet pipeline and returns RGBA pixels', async () => {
    const segmenter = segmenterReturning(2, 1)
    mockPipeline.mockResolvedValue(segmenter)
    mockFromBlob.mockResolvedValue('raw-image')

    const result = await segmentImage(bytes(), 'image/png')

    expect(mockPipeline).toHaveBeenCalledWith(
      'background-removal',
      'Xenova/modnet',
      expect.objectContaining({ dtype: 'fp32' }),
    )
    expect(segmenter).toHaveBeenCalledWith('raw-image')
    expect(result.width).toBe(2)
    expect(result.height).toBe(1)
    expect(Array.from(new Uint8ClampedArray(result.rgba))).toEqual(Array(8).fill(7))
  })

  it('accepts an array-shaped pipeline result', async () => {
    mockPipeline.mockResolvedValue(vi.fn().mockResolvedValue([{ data: new Uint8ClampedArray(4), height: 1, width: 1 }]))
    mockFromBlob.mockResolvedValue('raw-image')

    const result = await segmentImage(bytes(), 'image/png')
    expect(result.rgba.byteLength).toBe(4)
  })

  it('caches the pipeline across calls', async () => {
    mockPipeline.mockResolvedValue(segmenterReturning(1, 1))
    mockFromBlob.mockResolvedValue('raw-image')

    await segmentImage(bytes(), 'image/png')
    await segmentImage(bytes(), 'image/png')

    expect(mockPipeline).toHaveBeenCalledTimes(1)
  })

  it('retries the pipeline load after a failure instead of caching the rejection', async () => {
    mockPipeline.mockRejectedValueOnce(new Error('model fetch failed')).mockResolvedValue(segmenterReturning(1, 1))
    mockFromBlob.mockResolvedValue('raw-image')

    await expect(segmentImage(bytes(), 'image/png')).rejects.toThrow('model fetch failed')
    await expect(segmentImage(bytes(), 'image/png')).resolves.toMatchObject({ height: 1, width: 1 })
    expect(mockPipeline).toHaveBeenCalledTimes(2)
  })

  it('routes progress to the current caller, not the one that created the pipeline', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const segmenter = vi.fn()
    mockPipeline.mockResolvedValue(segmenter)
    mockFromBlob.mockResolvedValue('raw-image')

    segmenter.mockResolvedValueOnce({ data: new Uint8ClampedArray(4), height: 1, width: 1 })
    await segmentImage(bytes(), 'image/png', first)

    segmenter.mockImplementationOnce(async () => {
      capturedProgressCallback()({ progress: 42, status: 'progress' })
      return { data: new Uint8ClampedArray(4), height: 1, width: 1 }
    })
    await segmentImage(bytes(), 'image/png', second)

    expect(second).toHaveBeenCalledWith(42)
    expect(first).not.toHaveBeenCalled()
  })

  it('ignores progress events without a numeric progress', async () => {
    const onProgress = vi.fn()
    mockPipeline.mockImplementation(
      async (_task: string, _model: string, opts: { progress_callback: ProgressCallback }) => {
        opts.progress_callback({ status: 'initiate' })
        opts.progress_callback({ progress: 10, status: 'progress' })
        return segmenterReturning(1, 1)
      },
    )
    mockFromBlob.mockResolvedValue('raw-image')

    await segmentImage(bytes(), 'image/png', onProgress)

    expect(onProgress).toHaveBeenCalledExactlyOnceWith(10)
  })
})
