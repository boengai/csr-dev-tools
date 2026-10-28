/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { processImage } from './image'

// The colour each fillRect paints with, in order.
const fills: Array<string> = []

vi.mock('./canvas', () => ({
  createCanvasContext: (width: number, height: number) => {
    const ctx = {
      clearRect: vi.fn(),
      fillRect: vi.fn(() => fills.push(String(ctx.fillStyle))),
      fillStyle: '',
    }
    const canvas = { getContext: () => ctx, height, toDataURL: () => 'data:image/jpeg;base64,AAAA', width }
    return { canvas, ctx }
  },
  drawImageScaled: vi.fn(),
}))

/** An <img> that "decodes" as soon as it gets a src. */
class DecodedImage {
  crossOrigin = ''
  height = 100
  naturalHeight = 100
  naturalWidth = 200
  onerror: (() => void) | null = null
  onload: (() => void) | null = null
  width = 200

  set src(value: string) {
    if (value) queueMicrotask(() => this.onload?.())
  }
}

const png = new File(['x'], 'logo.png', { type: 'image/png' })

beforeEach(() => {
  fills.length = 0
  vi.stubGlobal('Image', DecodedImage)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:logo')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('processImage JPEG background', () => {
  it('flattens transparency onto white by default', async () => {
    await processImage(png, { format: 'image/jpeg', height: 50, strategy: 'stretch', width: 100 })

    expect(fills).toEqual(['#ffffff'])
  })

  it('uses the given backgroundColor', async () => {
    await processImage(png, {
      backgroundColor: '#123456',
      format: 'image/jpeg',
      height: 50,
      strategy: 'stretch',
      width: 100,
    })

    expect(fills).toEqual(['#123456'])
  })

  it('leaves formats with an alpha channel unfilled', async () => {
    await processImage(png, { format: 'image/png', height: 50, strategy: 'stretch', width: 100 })

    expect(fills).toEqual([])
  })
})
