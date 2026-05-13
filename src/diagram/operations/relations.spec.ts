import { describe, expect, it } from 'vitest'
import { addRelation, deleteRelation, updateRelation } from './relations'
import { addTable } from './tables'
import { createInitialDocument } from '../state'

const seedTwoTables = () => {
  const a = addTable(createInitialDocument(), { name: 'users' })
  const b = addTable(a.document, { name: 'posts' })
  return { doc: b.document, aId: a.id, bId: b.id, aCol: a.document.tables[a.id].columns[0].id, bCol: b.document.tables[b.id].columns[0].id }
}

describe('addRelation', () => {
  it('inserts a relation and appends to relationOrder', () => {
    const { doc, aId, bId, aCol, bCol } = seedTwoTables()
    const { document, id } = addRelation(doc, { from: { tableId: aId, columnId: aCol }, to: { tableId: bId, columnId: bCol }, kind: '1:N' })
    expect(id).toBeTruthy()
    expect(document.relations[id!]).toMatchObject({ kind: '1:N' })
    expect(document.relationOrder).toEqual([id])
  })

  it('rejects relations referencing unknown columns', () => {
    const { doc, aId, bId, aCol } = seedTwoTables()
    const out = addRelation(doc, { from: { tableId: aId, columnId: aCol }, to: { tableId: bId, columnId: 'missing' }, kind: '1:N' })
    expect(out.id).toBeNull()
    expect(out.document).toBe(doc)
  })
})

describe('updateRelation', () => {
  it('patches kind', () => {
    const { doc, aId, bId, aCol, bCol } = seedTwoTables()
    const created = addRelation(doc, { from: { tableId: aId, columnId: aCol }, to: { tableId: bId, columnId: bCol }, kind: '1:N' })
    const next = updateRelation(created.document, created.id!, { kind: 'N:M' })
    expect(next.relations[created.id!].kind).toBe('N:M')
  })

  it('is a no-op for unknown id', () => {
    const { doc } = seedTwoTables()
    expect(updateRelation(doc, 'missing', { kind: '1:1' })).toBe(doc)
  })
})

describe('deleteRelation', () => {
  it('removes the relation and order entry', () => {
    const { doc, aId, bId, aCol, bCol } = seedTwoTables()
    const created = addRelation(doc, { from: { tableId: aId, columnId: aCol }, to: { tableId: bId, columnId: bCol }, kind: '1:N' })
    const next = deleteRelation(created.document, created.id!)
    expect(next.relations).toEqual({})
    expect(next.relationOrder).toEqual([])
  })

  it('is a no-op for unknown id', () => {
    const { doc } = seedTwoTables()
    expect(deleteRelation(doc, 'missing')).toBe(doc)
  })
})
