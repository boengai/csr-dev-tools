import { describe, expect, it } from 'vitest'

import { createDefaultColumn } from '@/utils/db-diagram'

import { createInitialDocument } from '../state'
import { addColumn } from './columns'
import { documentToSchema, toDbml, toMermaid, toSql, toTypeScript } from './export'
import { addRelation } from './relations'
import { addTable } from './tables'

const seed = () => {
  const a = addTable(createInitialDocument(), { name: 'users' })
  const b = addTable(a.document, { name: 'posts' })
  const withFk = addColumn(b.document, b.id, createDefaultColumn('user_id'))
  const aCol = a.document.tables[a.id].columns[0].id
  const fkCol = withFk.id!
  const withRel = addRelation(withFk.document, {
    from: { tableId: a.id, columnId: aCol },
    to: { tableId: b.id, columnId: fkCol },
    kind: '1:N',
  })
  return withRel.document
}

describe('documentToSchema', () => {
  it('produces a DiagramSchema with stable order', () => {
    const schema = documentToSchema(seed())
    expect(schema.tables.map((t) => t.name)).toEqual(['users', 'posts'])
    expect(schema.relationships).toHaveLength(1)
  })
})

describe('exports', () => {
  it('toDbml emits non-empty text containing table names', () => {
    const out = toDbml(seed())
    expect(out).toMatch(/users/)
    expect(out).toMatch(/posts/)
  })
  it('toSql respects dialect', () => {
    const doc = seed()
    expect(toSql(doc, 'postgresql')).toMatch(/CREATE TABLE/)
    expect(toSql(doc, 'mysql')).toMatch(/CREATE TABLE/)
  })
  it('toMermaid and toTypeScript return non-empty strings', () => {
    const doc = seed()
    expect(toMermaid(doc).length).toBeGreaterThan(0)
    expect(toTypeScript(doc).length).toBeGreaterThan(0)
  })
})
