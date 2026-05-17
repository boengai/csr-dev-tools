import { describe, expect, it } from 'vitest'

import { createSequentialIdMinters } from './id-minters'
import { createDefaultColumn, gridLayoutPositions } from './defaults'

describe('createDefaultColumn', () => {
  it('should create a column with given name', () => {
    const { column: mintColumn } = createSequentialIdMinters()
    const col = createDefaultColumn('email', false, mintColumn)
    expect(col.name).toBe('email')
    expect(col.type).toBe('VARCHAR')
    expect(col.constraints.isPrimaryKey).toBe(false)
    expect(col.constraints.isNullable).toBe(true)
    expect(col.constraints.isUnique).toBe(false)
    expect(col.constraints.isForeignKey).toBe(false)
  })

  it('should create a primary key column when isPrimaryKey is true', () => {
    const { column: mintColumn } = createSequentialIdMinters()
    const col = createDefaultColumn('id', true, mintColumn)
    expect(col.name).toBe('id')
    expect(col.type).toBe('INT')
    expect(col.constraints.isPrimaryKey).toBe(true)
    expect(col.constraints.isNullable).toBe(false)
    expect(col.constraints.isUnique).toBe(true)
  })

  it('should mint the id via the provided minter', () => {
    const { column: mintColumn } = createSequentialIdMinters()
    const a = createDefaultColumn('a', false, mintColumn)
    const b = createDefaultColumn('b', false, mintColumn)
    expect(a.id).toBe('c_1')
    expect(b.id).toBe('c_2')
  })

  it('should default name to "column" when not provided', () => {
    const { column: mintColumn } = createSequentialIdMinters()
    const col = createDefaultColumn(undefined, false, mintColumn)
    expect(col.name).toBe('column')
  })
})

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
})

