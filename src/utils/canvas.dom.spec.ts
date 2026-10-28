/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { canvasToBlob, readImagePixels } from './canvas'

const fakeCanvas = (handler: (cb: (blob: Blob | null) => void, type?: string) => void): HTMLCanvasElement =>
  ({ toBlob: handler }) as unknown as HTMLCanvasElement

describe('canvasToBlob', () => {
  it('resolves with the blob produced by canvas.toBlob', async () => {
    const expected = new Blob(['x'], { type: 'image/png' })
    const canvas = fakeCanvas((cb) => cb(expected))
    await expect(canvasToBlob(canvas)).resolves.toBe(expected)
  })

  it('rejects when canvas.toBlob yields null', async () => {
    const canvas = fakeCanvas((cb) => cb(null))
    await expect(canvasToBlob(canvas)).rejects.toThrow(/Failed to convert canvas to blob/)
  })

  it('passes mimeType through to canvas.toBlob, defaulting to image/png', async () => {
    const seen = vi.fn<(cb: (blob: Blob | null) => void, type?: string) => void>((cb, type) => {
      cb(new Blob([], { type: type ?? 'image/png' }))
    })
    await canvasToBlob(fakeCanvas(seen))
    expect(seen).toHaveBeenLastCalledWith(expect.any(Function), 'image/png')

    await canvasToBlob(fakeCanvas(seen), 'image/jpeg')
    expect(seen).toHaveBeenLastCalledWith(expect.any(Function), 'image/jpeg')
  })
})

/** A source image whose pixel colours encode their own coordinates; alpha is 0 or 255. */
type FakeImage = { naturalHeight: number; naturalWidth: number; pixel: (x: number, y: number) => Array<number> }

/**
 * Minimal 2D context backed by a pixel buffer: `drawImage` composites the fake
 * image 1:1 (source-over, so transparent pixels keep what was there) and only in
 * the 5-argument form — Firefox mis-maps the 9-argument form for SVGs that only
 * have a viewBox, so the reader must not use it.
 */
const installFakeCanvas = () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    // Sized once, when the reader asks for its context.
    const { height, width } = this
    const buffer = new Uint8ClampedArray(width * height * 4)
    const rect = (x: number, y: number, w: number, h: number, each: (i: number, cx: number, cy: number) => void) => {
      for (let cy = y; cy < Math.min(y + h, height); cy++) {
        for (let cx = x; cx < Math.min(x + w, width); cx++) each((cy * width + cx) * 4, cx, cy)
      }
    }
    return {
      clearRect: (x: number, y: number, w: number, h: number) => rect(x, y, w, h, (i) => buffer.fill(0, i, i + 4)),
      drawImage: (...args: Array<unknown>) => {
        if (args.length !== 5) throw new Error(`expected the 5-argument drawImage, got ${args.length} arguments`)
        const [image, dx, dy, dw, dh] = args as [FakeImage, number, number, number, number]
        if (dw !== image.naturalWidth || dh !== image.naturalHeight) throw new Error('the fake only draws 1:1')
        rect(0, 0, width, height, (i, cx, cy) => {
          const sx = cx - dx
          const sy = cy - dy
          if (sx < 0 || sy < 0 || sx >= image.naturalWidth || sy >= image.naturalHeight) return
          const pixel = image.pixel(sx, sy)
          if (pixel[3] === 255) buffer.set(pixel, i)
        })
      },
      getImageData: (x: number, y: number, w: number, h: number) => {
        const data = new Uint8ClampedArray(w * h * 4)
        rect(x, y, w, h, (i, cx, cy) => data.set(buffer.subarray(i, i + 4), ((cy - y) * w + (cx - x)) * 4))
        return { data, height: h, width: w }
      },
    } as unknown as CanvasRenderingContext2D
  })
}

const fakeImage = (naturalWidth: number, naturalHeight: number, transparent = true): FakeImage => ({
  naturalHeight,
  naturalWidth,
  pixel: (x, y) => (transparent && (x + y) % 7 === 0 ? [9, 9, 9, 0] : [x % 256, x >> 8, y % 256, 255]),
})

describe('readImagePixels', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['one tile', 100, 50],
    ['two tiles side by side', 5000, 3],
    ['two tiles stacked', 3, 5000],
  ])('reads every pixel of %s into place, transparent pixels included', (_, width, height) => {
    installFakeCanvas()
    const image = fakeImage(width, height)

    const read = readImagePixels(image as unknown as HTMLImageElement, { height, width })

    expect(read).toMatchObject({ height, opaque: false, width })
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Premultiplied: fully transparent pixels read back as 0,0,0,0.
        const expected = (x + y) % 7 === 0 ? [0, 0, 0, 0] : image.pixel(x, y)
        const i = (y * width + x) * 4
        if (Array.from(read.data.subarray(i, i + 4)).join() !== expected.join()) {
          throw new Error(`pixel (${x}, ${y}) is ${read.data.subarray(i, i + 4).join()}, expected ${expected.join()}`)
        }
      }
    }
  })

  it('reports a fully opaque multi-tile image as opaque', () => {
    installFakeCanvas()
    const image = fakeImage(5000, 2, false)

    const read = readImagePixels(image as unknown as HTMLImageElement, { height: 2, width: 5000 })

    expect(read.opaque).toBe(true)
    expect(Array.from(read.data.subarray((5000 + 4999) * 4, (5000 + 5000) * 4))).toEqual(image.pixel(4999, 1))
  })
})
