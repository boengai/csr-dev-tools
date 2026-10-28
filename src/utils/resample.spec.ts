import { describe, expect, it } from 'vitest'

import { PILLOW_LANCZOS_CASES, resampleTestPattern } from '@/test/fixtures/resample-pillow'
import type { RgbaPixels } from '@/types'

import { prepareRgba, resampleRgba } from './resample'

const fill = (width: number, height: number, pixel: (x: number, y: number) => Array<number>): RgbaPixels => {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.set(pixel(x, y), (y * width + x) * 4)
    }
  }
  return { data, height, width }
}

const fullBox = ({ height, width }: RgbaPixels) => ({ height, width, x: 0, y: 0 })

const pixelsOf = ({ data }: RgbaPixels): Array<Array<number>> =>
  Array.from({ length: data.length / 4 }, (_, i) => Array.from(data.subarray(i * 4, i * 4 + 4)))

describe('resampleRgba', () => {
  it.each(PILLOW_LANCZOS_CASES)(
    'matches Pillow LANCZOS exactly ($name)',
    ({ alpha, box, expected, reducingGap, source, target }) => {
      const input = { data: resampleTestPattern(source.width, source.height, alpha), ...source }

      const output = resampleRgba(input, box, target.width, target.height, { reducingGap })

      expect(output.width).toBe(target.width)
      expect(output.height).toBe(target.height)
      expect(Array.from(output.data)).toEqual(expected)
    },
  )

  it('un-premultiplies opaque sources too, as Pillow does when reduce() lowers alpha', () => {
    // Pillow's reduce() multiplier is truncated, so averaging a huge all-255
    // block gives alpha 254; Pillow then un-premultiplies RGB back to 255:
    // Image.new('RGBA', (2048, 2048), 'white').resize((3, 2), LANCZOS, reducing_gap=3)
    const white = fill(2048, 2048, () => [255, 255, 255, 255])

    const output = resampleRgba(white, fullBox(white), 3, 2, { reducingGap: 3 })

    expect(new Set(pixelsOf(output).map((p) => p.join()))).toEqual(new Set(['255,255,255,254']))
  })

  it('averages a 1px checkerboard to mid-grey at a 6.67x reduction instead of aliasing', () => {
    const checker = fill(100, 100, (x, y) => ((x + y) % 2 === 0 ? [255, 255, 255, 255] : [0, 0, 0, 255]))

    const output = resampleRgba(checker, fullBox(checker), 15, 15)

    // Pillow gives 127-128 everywhere; a fixed 2x2-tap filter gives values near 0 and 255.
    const channels = pixelsOf(output).flatMap(([r, g, b]) => [r ?? 0, g ?? 0, b ?? 0])
    expect(Math.min(...channels)).toBeGreaterThanOrEqual(126)
    expect(Math.max(...channels)).toBeLessThanOrEqual(129)
  })

  it('keeps a solid colour exactly', () => {
    const solid = fill(37, 23, () => [200, 100, 50, 255])

    const output = resampleRgba(solid, fullBox(solid), 5, 4)

    expect(new Set(pixelsOf(output).map((p) => p.join()))).toEqual(new Set(['200,100,50,255']))
  })

  it('does not darken opaque pixels that border fully transparent black', () => {
    const half = fill(40, 20, (x) => (x < 20 ? [255, 0, 0, 255] : [0, 0, 0, 0]))

    const output = resampleRgba(half, fullBox(half), 7, 4)

    const edgeAndOpaque = pixelsOf(output).filter(([, , , a]) => (a ?? 0) >= 64)
    expect(edgeAndOpaque.some(([, , , a]) => (a ?? 0) < 250)).toBe(true)
    for (const [r, g, b] of edgeAndOpaque) {
      expect([r, g, b]).toEqual([255, 0, 0])
    }
  })

  it('resamples the requested source box, not the whole image', () => {
    // Blue only within 10px of the left/right edges. The box x=40..60 at 5x has a
    // ±15px kernel, so it reaches x=27.5..72.5: all red. Ignoring the box offset
    // (x=0..20) or its size (whole 100px row) pulls in blue.
    const blueEdges = fill(100, 20, (x) => (x < 10 || x >= 90 ? [0, 0, 255, 255] : [255, 0, 0, 255]))

    const output = resampleRgba(blueEdges, { height: 20, width: 20, x: 40, y: 0 }, 4, 4)

    expect(new Set(pixelsOf(output).map((p) => p.join()))).toEqual(new Set(['255,0,0,255']))
  })

  it('returns the source pixels unchanged at 1:1', () => {
    const input = { data: resampleTestPattern(9, 7, false), height: 7, width: 9 }

    const output = resampleRgba(input, fullBox(input), 9, 7)

    expect(Array.from(output.data)).toEqual(Array.from(input.data))
  })
})

describe('prepareRgba', () => {
  it('premultiplies into the given buffer with inPlace, so a reader holds one full-size copy, not two', () => {
    const source = fill(2, 1, (x) => (x === 0 ? [200, 100, 50, 128] : [10, 20, 30, 255]))

    const prepared = prepareRgba(source, { inPlace: true })

    expect(prepared.data).toBe(source.data)
    // Pillow's RGBA → RGBa: round(c * a / 255).
    expect(Array.from(prepared.data)).toEqual([100, 50, 25, 128, 10, 20, 30, 255])
  })

  it('leaves the source untouched by default', () => {
    const source = fill(1, 1, () => [200, 100, 50, 128])

    const prepared = prepareRgba(source)

    expect(prepared.data).not.toBe(source.data)
    expect(Array.from(source.data)).toEqual([200, 100, 50, 128])
  })
})
