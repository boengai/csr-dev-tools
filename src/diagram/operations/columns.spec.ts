import { describe, expect, it } from 'vitest'

import { createDefaultColumn } from '@/utils/db-diagram'

import { createInitialDocument } from '../state'
import { addColumn, deleteColumn, updateColumn } from './columns'
import { addTable } from './tables'

const seedWithTable = () => {
  const { document, id } = addTable(createInitialDocument(), { name: 'users' })
  return { doc: document, tableId: id }
}

describe('addColumn', () => {
  it('appends a column to the table', () => {
    const { doc, tableId } = seedWithTable()
    const { document, id } = addColumn(doc, tableId, createDefaultColumn('email'))
    expect(document.tables[tableId].columns.map((c) => c.id)).toContain(id)
    expect(document.tables[tableId].columns.at(-1)?.name).toBe('email')
  })

  it('is a no-op on unknown table', () => {
    const { doc } = seedWithTable()
    const out = addColumn(doc, 'missing', createDefaultColumn('email'))
    expect(out.document).toBe(doc)
    expect(out.id).toBeNull()
  })
})

describe('updateColumn', () => {
  it('patches the named column', () => {
    const { doc, tableId } = seedWithTable()
    const colId = doc.tables[tableId].columns[0].id
    const next = updateColumn(doc, tableId, colId, { name: 'renamed', type: 'BIGINT' })
    const updated = next.tables[tableId].columns[0]
    expect(updated.name).toBe('renamed')
    expect(updated.type).toBe('BIGINT')
  })

  it('is a no-op on unknown table or column', () => {
    const { doc, tableId } = seedWithTable()
    expect(updateColumn(doc, 'missing', 'c', { name: 'x' })).toBe(doc)
    expect(updateColumn(doc, tableId, 'missing', { name: 'x' })).toBe(doc)
  })
})

describe('deleteColumn', () => {
  it('removes the column and cascades relations touching it', () => {
    const { doc: initial, tableId: aId } = seedWithTable()
    const a = addColumn(initial, aId, createDefaultColumn('email'))
    const docAfterB = addTable(a.document, { name: 'posts' })
    const bId = docAfterB.id
    const targetColId = docAfterB.document.tables[bId].columns[0].id
    const sourceColId = a.id!
    const docWithRel = {
      ...docAfterB.document,
      relations: {
        r1: {
          id: 'r1',
          source: { tableId: aId, columnId: sourceColId },
          target: { tableId: bId, columnId: targetColId },
          kind: '1:N' as const,
        },
      },
      relationOrder: ['r1'],
    }
    const next = deleteColumn(docWithRel, aId, sourceColId)
    expect(next.tables[aId].columns.find((c) => c.id === sourceColId)).toBeUndefined()
    expect(next.relations).toEqual({})
    expect(next.relationOrder).toEqual([])
  })

  it('is a no-op on unknown table or column', () => {
    const { doc, tableId } = seedWithTable()
    expect(deleteColumn(doc, 'missing', 'c')).toBe(doc)
    expect(deleteColumn(doc, tableId, 'missing')).toBe(doc)
  })
})
