import { describe, expect, it } from 'vitest'

import type { DiagramDocument } from '@/types'

import { moveTable } from './operations/tables'
import { columnHandleId, createFlowProjector, documentToFlow, parseColumnHandleId } from './projections'
import { createInitialDocument } from './state'

const docWithOneTable = (): DiagramDocument => ({
  ...createInitialDocument(),
  tables: {
    t1: {
      id: 't1',
      name: 'users',
      position: { x: 100, y: 200 },
      columns: [
        {
          id: 'c1',
          name: 'id',
          type: 'UUID',
          constraints: { isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true },
        },
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
      columns: [
        {
          id: 'c2',
          name: 'user_id',
          type: 'UUID',
          constraints: { isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false },
        },
      ],
    }
    doc.tableOrder = ['t1', 't2']
    doc.relations = {
      r1: {
        id: 'r1',
        source: { tableId: 't1', columnId: 'c1' },
        target: { tableId: 't2', columnId: 'c2' },
        kind: '1:N',
      },
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
      sourceHandle: 't1-c1-source',
      targetHandle: 't2-c2-target',
    })
  })

  it('emits node data without callbacks', () => {
    const { nodes } = documentToFlow(docWithOneTable())
    expect(Object.keys(nodes[0].data).sort()).toEqual(['columns', 'tableName'])
  })
})

describe('column handle ids', () => {
  it('round-trips through parseColumnHandleId', () => {
    const handle = columnHandleId('t-1', 'c-2', 'source')
    expect(handle).toBe('t-1-c-2-source')
    expect(parseColumnHandleId(handle, 't-1', 'source')).toBe('c-2')
  })

  it('returns null for a handle of another table or kind', () => {
    expect(parseColumnHandleId('t1-c1-source', 't2', 'source')).toBeNull()
    expect(parseColumnHandleId('t1-c1-source', 't1', 'target')).toBeNull()
    expect(parseColumnHandleId('t1--source', 't1', 'source')).toBeNull()
  })
})

describe('createFlowProjector', () => {
  it('reuses node objects for tables that did not change', () => {
    const doc = docWithOneTable()
    doc.tables.t2 = { id: 't2', name: 'posts', position: { x: 0, y: 0 }, columns: [] }
    doc.tableOrder = ['t1', 't2']
    const project = createFlowProjector()
    const first = project(doc)

    const moved = moveTable(doc, 't2', { x: 50, y: 60 })
    const second = project(moved)

    expect(second.nodes[0]).toBe(first.nodes[0])
    expect(second.nodes[1]).not.toBe(first.nodes[1])
    expect(second.nodes[1].position).toEqual({ x: 50, y: 60 })
  })
})
