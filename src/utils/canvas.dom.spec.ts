/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'

import { canvasToBlob } from './canvas'

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
