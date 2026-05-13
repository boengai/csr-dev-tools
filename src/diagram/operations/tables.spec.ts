import { describe, expect, it } from 'vitest'
import type { DiagramDocument } from '@/types'
import { addTable, deleteTable, moveTable, renameTable } from './tables'
import { createInitialDocument } from '../state'

const seed = (): DiagramDocument => createInitialDocument()

describe('addTable', () => {
  it('inserts a new table and appends to tableOrder', () => {
    const { document, id } = addTable(seed(), { name: 'users' })
    expect(id).toMatch(/^t_/)
    expect(document.tables[id]).toMatchObject({ name: 'users' })
    expect(document.tableOrder).toEqual([id])
  })

  it('uses the provided position when given', () => {
    const { document, id } = addTable(seed(), { name: 'users', position: { x: 50, y: 75 } })
    expect(document.tables[id].position).toEqual({ x: 50, y: 75 })
  })

  it('assigns a non-overlapping default position when omitted', () => {
    let doc = seed()
    ;({ document: doc } = addTable(doc, { name: 'a' }))
    ;({ document: doc } = addTable(doc, { name: 'b' }))
    const positions = Object.values(doc.tables).map((t) => `${t.position.x},${t.position.y}`)
    expect(new Set(positions).size).toBe(2)
  })

  it('seeds a primary-key column by default', () => {
    const { document, id } = addTable(seed(), { name: 'users' })
    expect(document.tables[id].columns).toHaveLength(1)
    expect(document.tables[id].columns[0].constraints.isPrimaryKey).toBe(true)
  })
})

describe('renameTable', () => {
  it('updates the table name', () => {
    let doc = seed()
    const { document, id } = addTable(doc, { name: 'old' })
    doc = renameTable(document, id, 'new')
    expect(doc.tables[id].name).toBe('new')
  })

  it('is a no-op for unknown ID', () => {
    const doc = seed()
    expect(renameTable(doc, 'missing', 'x')).toBe(doc)
  })
})

describe('moveTable', () => {
  it('updates position immutably', () => {
    let doc = seed()
    const { document, id } = addTable(doc, { name: 'a' })
    const next = moveTable(document, id, { x: 999, y: 888 })
    expect(next.tables[id].position).toEqual({ x: 999, y: 888 })
    expect(document.tables[id].position).not.toEqual({ x: 999, y: 888 })
  })

  it('is a no-op for unknown ID', () => {
    const doc = seed()
    expect(moveTable(doc, 'missing', { x: 0, y: 0 })).toBe(doc)
  })
})

describe('deleteTable', () => {
  it('removes the table and its order entry', () => {
    let doc = seed()
    const { document, id } = addTable(doc, { name: 'a' })
    doc = deleteTable(document, id)
    expect(doc.tables[id]).toBeUndefined()
    expect(doc.tableOrder).not.toContain(id)
  })

  it('cascades to relations touching the table', () => {
    let doc = seed()
    const a = addTable(doc, { name: 'a' })
    doc = a.document
    const b = addTable(doc, { name: 'b' })
    doc = b.document
    const aCol = doc.tables[a.id].columns[0].id
    const bCol = doc.tables[b.id].columns[0].id
    doc = {
      ...doc,
      relations: { r1: { id: 'r1', source: { tableId: a.id, columnId: aCol }, target: { tableId: b.id, columnId: bCol }, kind: '1:N' } },
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
