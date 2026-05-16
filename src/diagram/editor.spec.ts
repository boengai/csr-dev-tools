import { describe, expect, it, vi } from 'vitest'

import { DiagramEditor } from './editor'
import { createInitialDocument } from './state'

describe('DiagramEditor skeleton', () => {
  it('starts with an empty document', () => {
    const editor = new DiagramEditor()
    expect(editor.getDocument()).toEqual(createInitialDocument())
  })

  it('notifies subscribers on replaceDocument and not before', () => {
    const editor = new DiagramEditor()
    const listener = vi.fn()
    const unsubscribe = editor.subscribe(listener)
    expect(listener).not.toHaveBeenCalled()

    const next = { ...editor.getDocument(), diagramName: 'Renamed' }
    editor.replaceDocument(next)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ diagramName: 'Renamed' }))

    unsubscribe()
    editor.replaceDocument({ ...next, diagramName: 'Again' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('replaceDocument validates basic shape and falls back to fresh document on failure', () => {
    const editor = new DiagramEditor()
    // @ts-expect-error intentional bad shape
    editor.replaceDocument({ not: 'a document' })
    expect(editor.getDocument()).toEqual(createInitialDocument())
  })
})

describe('DiagramEditor table ops', () => {
  it('addTable returns an ID and notifies', () => {
    const editor = new DiagramEditor()
    const listener = vi.fn()
    editor.subscribe(listener)
    const id = editor.addTable({ name: 'users' })
    expect(id).toBeTruthy()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(editor.getDocument().tables[id].name).toBe('users')
  })

  it('renameTable is a no-op on unknown id (no notify)', () => {
    const editor = new DiagramEditor()
    const listener = vi.fn()
    editor.subscribe(listener)
    editor.renameTable('missing', 'x')
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('DiagramEditor DBML latch', () => {
  it('structural ops regenerate DBML text when source is diagram', () => {
    const editor = new DiagramEditor()
    editor.addTable({ name: 'users' })
    const doc = editor.getDocument()
    expect(doc.dbmlSource).toBe('diagram')
    expect(doc.dbmlText).toMatch(/users/)
  })

  it('structural ops preserve user DBML draft when source is editor', () => {
    const editor = new DiagramEditor()
    editor.setDbmlText('user draft DBML — work in progress')
    expect(editor.getDocument().dbmlSource).toBe('editor')

    const tableId = editor.addTable({ name: 'orders' })

    // The structural change applied (table is in the document)
    expect(editor.getDocument().tables[tableId]?.name).toBe('orders')
    // But the user's DBML draft is NOT overwritten
    expect(editor.getDocument().dbmlText).toBe('user draft DBML — work in progress')
    expect(editor.getDocument().dbmlSource).toBe('editor')
  })

  it('applyDbmlNow keeps typed text intact', () => {
    const editor = new DiagramEditor()
    const typed = 'Table users {\n  id uuid [pk]\n}'
    editor.setDbmlText(typed)
    const result = editor.applyDbmlNow()
    expect(result.tableCount).toBeGreaterThan(0)
    expect(editor.getDocument().dbmlText).toBe(typed)
  })
})
