import { describe, expect, it } from 'vitest'

import { entry, nth } from '@/test/nth'
import type { DiagramDocument } from '@/types'

import { createSequentialIdMinters } from '../id-minters'
import { createInitialDocument } from '../state'
import { addTable, deleteTable, moveTable, renameTable } from './tables'

const seed = (): DiagramDocument => createInitialDocument()

describe('addTable', () => {
  it('inserts a new table and appends to tableOrder', () => {
    const { document, id } = addTable(seed(), { name: 'users' }, createSequentialIdMinters())
    expect(id).toBe('t_1')
    expect(document.tables[id]).toMatchObject({ name: 'users' })
    expect(document.tableOrder).toEqual([id])
  })

  it('uses the provided position when given', () => {
    const { document, id } = addTable(
      seed(),
      { name: 'users', position: { x: 50, y: 75 } },
      createSequentialIdMinters(),
    )
    expect(entry(document.tables, id).position).toEqual({ x: 50, y: 75 })
  })

  it('assigns a non-overlapping default position when omitted', () => {
    const minters = createSequentialIdMinters()
    let doc = seed()
    ;({ document: doc } = addTable(doc, { name: 'a' }, minters))
    ;({ document: doc } = addTable(doc, { name: 'b' }, minters))
    const positions = Object.values(doc.tables).map((t) => `${t.position.x},${t.position.y}`)
    expect(new Set(positions).size).toBe(2)
  })

  it('seeds a primary-key column by default', () => {
    const { document, id } = addTable(seed(), { name: 'users' }, createSequentialIdMinters())
    expect(entry(document.tables, id).columns).toHaveLength(1)
    expect(nth(entry(document.tables, id).columns, 0).constraints.isPrimaryKey).toBe(true)
    expect(nth(entry(document.tables, id).columns, 0).id).toBe('c_1')
  })
})

describe('renameTable', () => {
  it('updates the table name', () => {
    let doc = seed()
    const { document, id } = addTable(doc, { name: 'old' }, createSequentialIdMinters())
    doc = renameTable(document, id, 'new')
    expect(entry(doc.tables, id).name).toBe('new')
  })

  it('is a no-op for unknown ID', () => {
    const doc = seed()
    expect(renameTable(doc, 'missing', 'x')).toBe(doc)
  })
})

describe('moveTable', () => {
  it('updates position immutably', () => {
    let doc = seed()
    const { document, id } = addTable(doc, { name: 'a' }, createSequentialIdMinters())
    const next = moveTable(document, id, { x: 999, y: 888 })
    expect(entry(next.tables, id).position).toEqual({ x: 999, y: 888 })
    expect(entry(document.tables, id).position).not.toEqual({ x: 999, y: 888 })
  })

  it('is a no-op for unknown ID', () => {
    const doc = seed()
    expect(moveTable(doc, 'missing', { x: 0, y: 0 })).toBe(doc)
  })
})

describe('deleteTable', () => {
  it('removes the table and its order entry', () => {
    let doc = seed()
    const { document, id } = addTable(doc, { name: 'a' }, createSequentialIdMinters())
    doc = deleteTable(document, id)
    expect(doc.tables[id]).toBeUndefined()
    expect(doc.tableOrder).not.toContain(id)
  })

  it('cascades to relations touching the table', () => {
    const minters = createSequentialIdMinters()
    let doc = seed()
    const a = addTable(doc, { name: 'a' }, minters)
    doc = a.document
    const b = addTable(doc, { name: 'b' }, minters)
    doc = b.document
    const aCol = nth(entry(doc.tables, a.id).columns, 0).id
    const bCol = nth(entry(doc.tables, b.id).columns, 0).id
    doc = {
      ...doc,
      relations: {
        r1: {
          id: 'r1',
          source: { tableId: a.id, columnId: aCol },
          target: { tableId: b.id, columnId: bCol },
          kind: '1:N',
        },
      },
      relationOrder: ['r1'],
    }
    const next = deleteTable(doc, a.id)
    expect(next.relations).toEqual({})
    expect(next.relationOrder).toEqual([])
  })

  it('is a no-op for unknown ID', () => {
    const doc = seed()
    expect(deleteTable(doc, 'missing')).toBe(doc)
  })
})
