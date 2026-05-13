import { describe, expect, it } from 'vitest'
import type { DiagramDocument } from '@/types'
import { documentToFlow } from './projections'
import { createInitialDocument } from './state'

const docWithOneTable = (): DiagramDocument => ({
  ...createInitialDocument(),
  tables: {
    t1: {
      id: 't1',
      name: 'users',
      position: { x: 100, y: 200 },
      columns: [
        { id: 'c1', name: 'id', type: 'UUID', constraints: { isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true } },
      ],
    },
  },
  tableOrder: ['t1'],
})

describe('documentToFlow', () => {
  it('projects a single table to one node with no edges', () => {
    const { nodes, edges } = documentToFlow(docWithOneTable())
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({
      id: 't1',
      type: 'tableNode',
      position: { x: 100, y: 200 },
      data: expect.objectContaining({ tableName: 'users', columns: expect.any(Array) }),
    })
    expect(edges).toEqual([])
  })

  it('preserves table order via tableOrder', () => {
    const doc = docWithOneTable()
    doc.tables.t2 = { id: 't2', name: 'posts', position: { x: 0, y: 0 }, columns: [] }
    doc.tableOrder = ['t2', 't1']
    const { nodes } = documentToFlow(doc)
    expect(nodes.map((n) => n.id)).toEqual(['t2', 't1'])
  })

  it('projects relations to edges', () => {
    const doc = docWithOneTable()
    doc.tables.t2 = {
      id: 't2',
      name: 'posts',
      position: { x: 400, y: 200 },
      columns: [{ id: 'c2', name: 'user_id', type: 'UUID', constraints: { isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false } }],
    }
    doc.tableOrder = ['t1', 't2']
    doc.relations = {
      r1: { id: 'r1', source: { tableId: 't1', columnId: 'c1' }, target: { tableId: 't2', columnId: 'c2' }, kind: '1:N' },
    }
    doc.relationOrder = ['r1']
    const { edges } = documentToFlow(doc)
    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({
      id: 'r1',
      source: 't1',
      target: 't2',
      type: 'relationship',
      data: { sourceColumnId: 'c1', targetColumnId: 'c2', relationType: '1:N' },
    })
  })
})
