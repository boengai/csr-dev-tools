/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getReadableContext2d, readCanvasColorAt } from './color-picker'

afterEach(() => {
  vi.restoreAllMocks()
})

const fakeCtx = (rgb: [number, number, number]) =>
  ({
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([...rgb, 255]) })),
  }) as unknown as CanvasRenderingContext2D

describe('getReadableContext2d', () => {
  it('requests the context once per canvas, with willReadFrequently', () => {
    const ctx = fakeCtx([0, 0, 0])
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
    const canvas = document.createElement('canvas')

    expect(getReadableContext2d(canvas)).toBe(ctx)
    expect(getReadableContext2d(canvas)).toBe(ctx)
    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith('2d', { willReadFrequently: true })
  })
})

describe('readCanvasColorAt', () => {
  it('maps the viewport point to a canvas pixel (scaled and clamped)', () => {
    const ctx = fakeCtx([255, 0, 0])
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 100
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ height: 50, left: 10, top: 20, width: 100 } as DOMRect)

    expect(readCanvasColorAt(canvas, 60, 45)?.hex).toBe('#ff0000')
    expect(ctx.getImageData).toHaveBeenLastCalledWith(100, 50, 1, 1)

    readCanvasColorAt(canvas, 10_000, -10_000)
    expect(ctx.getImageData).toHaveBeenLastCalledWith(199, 0, 1, 1)
  })
})
