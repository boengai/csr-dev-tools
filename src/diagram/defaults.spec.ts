import { describe, expect, it } from 'vitest'

import { createDefaultColumn } from './defaults'
import { createSequentialIdMinters } from './id-minters'

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
