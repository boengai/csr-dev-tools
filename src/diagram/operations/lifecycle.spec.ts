import { describe, expect, it } from 'vitest'

import { createDefaultColumn } from '@/diagram/defaults'
import type { DiagramSchema } from '@/types'

import { createSequentialIdMinters } from '../id-minters'
import { createInitialDocument } from '../state'
import { addColumn } from './columns'
import { documentToSchema } from './export'
import { newDiagram, schemaToDocument, setDiagramName } from './lifecycle'
import { addRelation } from './relations'
import { addTable } from './tables'

describe('newDiagram', () => {
  it('resets to an empty document with default name', () => {
    const doc = newDiagram()
    expect(doc.diagramName).toBe('Untitled Diagram')
    expect(doc.tables).toEqual({})
  })
})

describe('setDiagramName', () => {
  it('updates the name', () => {
    expect(setDiagramName(createInitialDocument(), 'My Schema').diagramName).toBe('My Schema')
  })
})

describe('schemaToDocument', () => {
  it('round-trips with documentToSchema preserving table/relation counts', () => {
    const minters = createSequentialIdMinters()
    let doc = createInitialDocument()
    const a = addTable(doc, { name: 'users' }, minters)
    doc = a.document
    const b = addTable(doc, { name: 'posts' }, minters)
    doc = b.document
    // Isolated minter for createDefaultColumn's input shape; addColumn() mints the stored id from `minters`.
    const colMinters = createSequentialIdMinters()
    const fk = addColumn(doc, b.id, createDefaultColumn('user_id', false, colMinters.column), minters)
    doc = fk.document
    const rel = addRelation(
      doc,
      {
        from: { tableId: a.id, columnId: doc.tables[a.id].columns[0].id },
        to: { tableId: b.id, columnId: fk.id! },
        kind: '1:N',
      },
      minters,
    )
    doc = rel.document
    const schema: DiagramSchema = documentToSchema(doc)
    const round = schemaToDocument(schema, createInitialDocument())
    expect(Object.keys(round.tables)).toHaveLength(2)
    expect(Object.keys(round.relations)).toHaveLength(1)
  })
})
