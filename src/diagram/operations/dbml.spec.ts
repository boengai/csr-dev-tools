import { describe, expect, it } from 'vitest'
import { addTable } from './tables'
import { applyDbmlNow, regenerateDbmlFromDocument, setDbmlText } from './dbml'
import { createInitialDocument } from '../state'

describe('setDbmlText', () => {
  it('stores text verbatim and sets source to editor', () => {
    const doc = setDbmlText(createInitialDocument(), 'Table users { id uuid }')
    expect(doc.dbmlText).toBe('Table users { id uuid }')
    expect(doc.dbmlSource).toBe('editor')
  })
})

describe('regenerateDbmlFromDocument', () => {
  it('writes generated DBML and sets source to diagram', () => {
    const seeded = addTable(createInitialDocument(), { name: 'users' }).document
    const next = regenerateDbmlFromDocument(seeded)
    expect(next.dbmlSource).toBe('diagram')
    expect(next.dbmlText).toMatch(/users/)
  })

  it('leaves an empty document with empty text', () => {
    const next = regenerateDbmlFromDocument(createInitialDocument())
    expect(next.dbmlText).toBe('')
  })
})

describe('applyDbmlNow', () => {
  it('parses dbmlText into structural state without overwriting the text', () => {
    const withText = setDbmlText(createInitialDocument(), 'Table users {\n  id uuid [pk]\n}')
    const { document, result } = applyDbmlNow(withText)
    expect(result.tableCount).toBeGreaterThan(0)
    expect(Object.keys(document.tables).length).toBe(result.tableCount)
    expect(document.dbmlText).toBe(withText.dbmlText)
    expect(document.dbmlSource).toBe('editor')
  })

  it('records errors and clears structural state when no tables parse', () => {
    const withGarbage = setDbmlText(createInitialDocument(), 'not dbml')
    const { document, result } = applyDbmlNow(withGarbage)
    expect(result.tableCount).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(document.dbmlErrors).toEqual(result.errors)
  })
})
