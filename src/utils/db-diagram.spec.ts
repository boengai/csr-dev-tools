import { describe, expect, it } from 'vitest'

import { createDefaultColumn, createDefaultTable, generateId, gridLayoutPositions } from './db-diagram'

describe('db-diagram utils', () => {
  describe('generateId', () => {
    it('should return a unique string each call', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should return a non-empty string', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('createDefaultColumn', () => {
    it('should create a column with given name', () => {
      const col = createDefaultColumn('email')
      expect(col.name).toBe('email')
      expect(col.type).toBe('VARCHAR')
      expect(col.constraints.isPrimaryKey).toBe(false)
      expect(col.constraints.isNullable).toBe(true)
      expect(col.constraints.isUnique).toBe(false)
      expect(col.constraints.isForeignKey).toBe(false)
    })

    it('should create a primary key column when isPrimaryKey is true', () => {
      const col = createDefaultColumn('id', true)
      expect(col.name).toBe('id')
      expect(col.type).toBe('INT')
      expect(col.constraints.isPrimaryKey).toBe(true)
      expect(col.constraints.isNullable).toBe(false)
      expect(col.constraints.isUnique).toBe(true)
    })

    it('should generate a unique id for each column', () => {
      const col1 = createDefaultColumn('a')
      const col2 = createDefaultColumn('b')
      expect(col1.id).not.toBe(col2.id)
    })

    it('should default name to "column" when not provided', () => {
      const col = createDefaultColumn()
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
        { x: 400, y: 0 },
        { x: 800, y: 0 },
        { x: 0, y: 350 },
      ])
    })

    it('should wrap to third row for 7 items', () => {
      const positions = gridLayoutPositions(7)
      expect(positions).toHaveLength(7)
      // First row
      expect(positions[0]).toEqual({ x: 0, y: 0 })
      expect(positions[2]).toEqual({ x: 800, y: 0 })
      // Second row
      expect(positions[3]).toEqual({ x: 0, y: 350 })
      expect(positions[5]).toEqual({ x: 800, y: 350 })
      // Third row
      expect(positions[6]).toEqual({ x: 0, y: 700 })
    })
  })

  describe('createDefaultTable', () => {
    it('should create table with incrementing name based on count', () => {
      const t0 = createDefaultTable(0)
      expect(t0.tableName).toBe('table_1')

      const t3 = createDefaultTable(3)
      expect(t3.tableName).toBe('table_4')
    })

    it('should include one default id column as primary key', () => {
      const table = createDefaultTable(0)
      expect(table.columns).toHaveLength(1)
      expect(table.columns[0].name).toBe('id')
      expect(table.columns[0].type).toBe('INT')
      expect(table.columns[0].constraints.isPrimaryKey).toBe(true)
    })
  })
})
