import { describe, expect, it } from 'vitest'

import { gridLayoutPositions } from './layout'

describe('gridLayoutPositions', () => {
  it('should return empty array for count 0', () => {
    expect(gridLayoutPositions(0)).toEqual([])
  })

  it('should return single position at origin for count 1', () => {
    expect(gridLayoutPositions(1)).toEqual([{ x: 0, y: 0 }])
  })

  it('should lay out 4 items in a 3-column grid', () => {
    const positions = gridLayoutPositions(4)
    expect(positions).toEqual([
      { x: 0, y: 0 },
      { x: 600, y: 0 },
      { x: 1200, y: 0 },
      { x: 0, y: 550 },
    ])
  })

  it('should wrap to third row for 7 items', () => {
    const positions = gridLayoutPositions(7)
    expect(positions).toHaveLength(7)
    expect(positions[0]).toEqual({ x: 0, y: 0 })
    expect(positions[2]).toEqual({ x: 1200, y: 0 })
    expect(positions[3]).toEqual({ x: 0, y: 550 })
    expect(positions[5]).toEqual({ x: 1200, y: 550 })
    expect(positions[6]).toEqual({ x: 0, y: 1100 })
  })

  it('result length always equals count', () => {
    for (const n of [0, 1, 3, 5, 9, 12]) {
      expect(gridLayoutPositions(n)).toHaveLength(n)
    }
  })

  it('all positions are pairwise distinct', () => {
    for (const n of [2, 4, 7, 10]) {
      const positions = gridLayoutPositions(n)
      const keys = positions.map(({ x, y }) => `${x},${y}`)
      expect(new Set(keys).size).toBe(n)
    }
  })

  it('index 0 is always the origin', () => {
    for (const n of [1, 2, 5, 9]) {
      expect(gridLayoutPositions(n)[0]).toEqual({ x: 0, y: 0 })
    }
  })
})
