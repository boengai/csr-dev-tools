import { describe, expect, it } from 'vitest'
import { cloneDocument, createInitialDocument } from './state'

describe('createInitialDocument', () => {
  it('returns an empty document with default name', () => {
    const doc = createInitialDocument()
    expect(doc.diagramId).toBe(null)
    expect(doc.diagramName).toBe('Untitled Diagram')
    expect(doc.tables).toEqual({})
    expect(doc.tableOrder).toEqual([])
    expect(doc.relations).toEqual({})
    expect(doc.relationOrder).toEqual([])
    expect(doc.dbmlText).toBe('')
    expect(doc.dbmlSource).toBe('diagram')
    expect(doc.dbmlErrors).toEqual([])
  })
})

describe('cloneDocument', () => {
  it('produces a deep-equal but not-identical document', () => {
    const a = createInitialDocument()
    const b = cloneDocument(a)
    expect(b).toEqual(a)
    expect(b).not.toBe(a)
    expect(b.tables).not.toBe(a.tables)
    expect(b.relations).not.toBe(a.relations)
  })
})
