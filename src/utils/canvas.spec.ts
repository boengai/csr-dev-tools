import { describe, expect, it } from 'vitest'

import { clipToImage, planReadTiles, planScaledDraw } from './canvas'

const rect = (x: number, y: number, width: number, height: number) => ({ height, width, x, y })
const size = (width: number, height: number) => ({ height, width })

describe('planScaledDraw', () => {
  it('resamples a whole-image reduction', () => {
    expect(planScaledDraw(rect(0, 0, 1000, 1000), rect(0, 0, 150, 150), size(1000, 1000))).toEqual({
      kind: 'resample',
      position: { x: 0, y: 0 },
      size: { height: 150, width: 150 },
    })
  })

  it('rounds the destination edges, so a letterbox stays centred', () => {
    // 1000x587 into a 16px favicon: 16x9.392 at y=3.304. Edges 3.304 → 3 and
    // 12.696 → 13 give 10 rows with 3px above and below; rounding the origin
    // and the size separately gives 9 rows and an uneven 3/4 margin.
    const plan = planScaledDraw(rect(0, 0, 1000, 587), rect(0, 3.304, 16, 9.392), size(1000, 587))

    expect(plan).toEqual({ kind: 'resample', position: { x: 0, y: 3 }, size: { height: 10, width: 16 } })
  })

  it('resamples when only one axis shrinks', () => {
    expect(planScaledDraw(rect(0, 0, 100, 100), rect(0, 0, 200, 50), size(100, 100))).toMatchObject({
      kind: 'resample',
    })
  })

  it('compares against the source rect, not the whole image', () => {
    // A 300px-wide crop drawn 300px wide is a 1:1 copy even from a larger image.
    expect(planScaledDraw(rect(350, 0, 300, 300), rect(0, 0, 300, 300), size(1000, 300))).toEqual({
      kind: 'drawImage',
    })
  })

  it('leaves sources over 2^26 px to drawImage rather than buffering them', () => {
    expect(planScaledDraw(rect(0, 0, 10000, 7000), rect(0, 0, 150, 105), size(10000, 7000))).toEqual({
      kind: 'drawImage',
    })
  })

  it.each([
    ['an enlargement', rect(0, 0, 100, 100), rect(0, 0, 200, 200)],
    ['a 1:1 copy', rect(0, 0, 100, 100), rect(10, 10, 100, 100)],
    ['a zero-size source', rect(0, 0, 0, 0), rect(0, 0, 16, 16)],
    ['a NaN destination', rect(0, 0, 100, 100), rect(Number.NaN, 0, Number.NaN, 16)],
  ])('leaves %s to drawImage', (_, source, target) => {
    expect(planScaledDraw(source, target, size(100, 100))).toEqual({ kind: 'drawImage' })
  })
})

describe('planReadTiles', () => {
  it('reads an image of up to 4096x4096 in one tile', () => {
    expect(planReadTiles(size(4096, 4096))).toEqual([rect(0, 0, 4096, 4096)])
  })

  it('splits wider images into columns of at most 4096 px', () => {
    expect(planReadTiles(size(10000, 100))).toEqual([
      rect(0, 0, 4096, 100),
      rect(4096, 0, 4096, 100),
      rect(8192, 0, 1808, 100),
    ])
  })

  it('covers every pixel of a large image exactly once, in tiles within 2^24 px', () => {
    const tiles = planReadTiles(size(70000, 5000))

    expect(tiles.every(({ height, width }) => width <= 4096 && height <= 4096)).toBe(true)
    expect(tiles.reduce((area, { height, width }) => area + width * height, 0)).toBe(70000 * 5000)
    expect(new Set(tiles.map(({ x, y }) => `${x},${y}`)).size).toBe(tiles.length)
  })
})

describe('clipToImage', () => {
  it('leaves an in-bounds source untouched', () => {
    expect(clipToImage(rect(10, 20, 300, 200), rect(0, 0, 150, 100), size(1000, 600))).toEqual({
      source: rect(10, 20, 300, 200),
      target: rect(0, 0, 150, 100),
    })
  })

  it('clips an overhanging source to the image and the target in proportion, like drawImage', () => {
    // 1400 source px → 150 target px; the 200px overhang on each side is 150/1400*200 ≈ 21.43 target px.
    const clipped = clipToImage(rect(-200, 0, 1400, 600), rect(0, 0, 150, 150), size(1000, 600))

    expect(clipped?.source).toEqual(rect(0, 0, 1000, 600))
    expect(clipped?.target.x).toBeCloseTo(21.4286, 4)
    expect(clipped?.target.width).toBeCloseTo(107.1429, 4)
    expect(clipped?.target.y).toBe(0)
    expect(clipped?.target.height).toBe(150)
  })

  it('returns null when the source misses the image', () => {
    expect(clipToImage(rect(1000, 0, 50, 50), rect(0, 0, 50, 50), size(1000, 600))).toBeNull()
  })
})
