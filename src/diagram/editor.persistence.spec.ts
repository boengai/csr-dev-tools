import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiagramEditor } from './editor'
import { createInitialDocument } from './state'
import { createInMemoryDiagramStorage } from './storage'
import type { DiagramSchema } from '@/types'

const createTestDoc = () => createInitialDocument()

const usersSchema = (): DiagramSchema => ({
  tables: [
    {
      id: 't1',
      name: 'users',
      columns: [
        {
          id: 'c1',
          name: 'id',
          type: 'UUID',
          constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: true, isUnique: true },
        },
      ],
      position: { x: 0, y: 0 },
    },
  ],
  relationships: [],
})

describe('DiagramEditor.listDiagrams', () => {
  it('returns the storage index', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveIndex([
      { id: 'a', name: 'A', tableCount: 0, createdAt: '2026-05-13T00:00:00Z', updatedAt: '2026-05-13T00:00:00Z' },
    ])
    const editor = new DiagramEditor({ storage })
    expect(editor.listDiagrams()).toEqual([
      { id: 'a', name: 'A', tableCount: 0, createdAt: '2026-05-13T00:00:00Z', updatedAt: '2026-05-13T00:00:00Z' },
    ])
  })
})

describe('DiagramEditor.newDiagram', () => {
  it('picks "Untitled Diagram" when the index is empty', () => {
    const editor = new DiagramEditor({ storage: createInMemoryDiagramStorage() })
    editor.newDiagram()
    expect(editor.getDocument().diagramName).toBe('Untitled Diagram')
  })

  it('appends an increment when "Untitled Diagram" is taken', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveIndex([
      { id: 'a', name: 'Untitled Diagram', tableCount: 0, createdAt: '', updatedAt: '' },
      { id: 'b', name: 'Untitled Diagram 2', tableCount: 0, createdAt: '', updatedAt: '' },
    ])
    const editor = new DiagramEditor({ storage })
    editor.newDiagram()
    expect(editor.getDocument().diagramName).toBe('Untitled Diagram 3')
  })

  it('resets the diagramId so the next save mints a fresh one', () => {
    const editor = new DiagramEditor({
      storage: createInMemoryDiagramStorage(),
      document: { ...createTestDoc(), diagramId: 'pre-existing' },
    })
    editor.newDiagram()
    expect(editor.getDocument().diagramId).toBe(null)
  })
})

describe('DiagramEditor.deleteDiagram', () => {
  it('removes the entry from storage', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveIndex([{ id: 'd1', name: 'X', tableCount: 1, createdAt: '', updatedAt: '' }])
    const editor = new DiagramEditor({ storage })
    editor.deleteDiagram('d1')
    expect(storage.loadIndex()).toEqual([])
    expect(storage.loadDiagram('d1')).toBe(null)
  })

  it('resets the active document when the deleted id was the active one', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveIndex([{ id: 'd1', name: 'X', tableCount: 1, createdAt: '', updatedAt: '' }])
    const editor = new DiagramEditor({ storage })
    editor.loadDiagram('d1')
    expect(editor.getDocument().diagramId).toBe('d1')

    editor.deleteDiagram('d1')
    expect(editor.getDocument().diagramId).toBe(null)
    expect(editor.getDocument().tableOrder).toEqual([])
  })

  it('leaves the active document alone when deleting a non-active id', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveDiagram('d2', usersSchema())
    storage.saveIndex([
      { id: 'd1', name: 'A', tableCount: 1, createdAt: '', updatedAt: '' },
      { id: 'd2', name: 'B', tableCount: 1, createdAt: '', updatedAt: '' },
    ])
    const editor = new DiagramEditor({ storage })
    editor.loadDiagram('d1')

    editor.deleteDiagram('d2')
    expect(editor.getDocument().diagramId).toBe('d1')
    expect(storage.loadDiagram('d2')).toBe(null)
  })
})

describe('DiagramEditor.renameDiagram', () => {
  it('updates the index entry name', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveIndex([{ id: 'd1', name: 'Old', tableCount: 0, createdAt: '', updatedAt: '' }])
    const editor = new DiagramEditor({ storage })
    editor.renameDiagram('d1', 'New')
    expect(storage.loadIndex()[0].name).toBe('New')
  })

  it('updates the active document name when the renamed id is active', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveIndex([{ id: 'd1', name: 'Old', tableCount: 1, createdAt: '', updatedAt: '' }])
    const editor = new DiagramEditor({ storage })
    editor.loadDiagram('d1')
    editor.renameDiagram('d1', 'Renamed')
    expect(editor.getDocument().diagramName).toBe('Renamed')
  })

  it('ignores empty/whitespace names', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveIndex([{ id: 'd1', name: 'Old', tableCount: 0, createdAt: '', updatedAt: '' }])
    const editor = new DiagramEditor({ storage })
    editor.renameDiagram('d1', '   ')
    expect(storage.loadIndex()[0].name).toBe('Old')
  })
})

describe('DiagramEditor.subscribeToIndex', () => {
  it('fires the listener after deleteDiagram and renameDiagram', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveIndex([{ id: 'd1', name: 'X', tableCount: 1, createdAt: '', updatedAt: '' }])
    const editor = new DiagramEditor({ storage })
    const listener = vi.fn()
    editor.subscribeToIndex(listener)
    editor.renameDiagram('d1', 'Y')
    expect(listener).toHaveBeenCalledTimes(1)
    editor.deleteDiagram('d1')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('unsubscribes correctly', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveIndex([{ id: 'd1', name: 'X', tableCount: 0, createdAt: '', updatedAt: '' }])
    const editor = new DiagramEditor({ storage })
    const listener = vi.fn()
    const off = editor.subscribeToIndex(listener)
    off()
    editor.renameDiagram('d1', 'Y')
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('DiagramEditor autosave', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('schedules a save after a user mutation', () => {
    const storage = createInMemoryDiagramStorage()
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.addTable({ name: 'users' })
    expect(storage.saves).toBe(0)
    vi.advanceTimersByTime(1000)
    expect(storage.saves).toBe(1)
  })

  it('coalesces rapid mutations into one save', () => {
    const storage = createInMemoryDiagramStorage()
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.addTable({ name: 'users' })
    vi.advanceTimersByTime(500)
    editor.addTable({ name: 'orders' })
    vi.advanceTimersByTime(500)
    expect(storage.saves).toBe(0)
    vi.advanceTimersByTime(500)
    expect(storage.saves).toBe(1)
  })

  it('mints a diagramId on first save and reuses it', () => {
    const storage = createInMemoryDiagramStorage({ idGenerator: () => 'minted' })
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.addTable({ name: 'users' })
    vi.advanceTimersByTime(1000)
    expect(editor.getDocument().diagramId).toBe('minted')
    expect(storage.loadDiagram('minted')).not.toBe(null)

    editor.renameTable(editor.getDocument().tableOrder[0], 'people')
    vi.advanceTimersByTime(1000)
    expect(storage.saves).toBe(2)
    expect(editor.getDocument().diagramId).toBe('minted')
  })

  it('writes an index entry on save with tableCount and timestamps from clock()', () => {
    const storage = createInMemoryDiagramStorage({ idGenerator: () => 'd1' })
    const editor = new DiagramEditor({
      storage,
      autosaveMs: 1000,
      clock: () => '2026-05-14T00:00:00Z',
    })
    editor.addTable({ name: 'users' })
    vi.advanceTimersByTime(1000)
    const idx = storage.loadIndex()
    expect(idx).toHaveLength(1)
    expect(idx[0]).toMatchObject({
      id: 'd1',
      tableCount: 1,
      createdAt: '2026-05-14T00:00:00Z',
      updatedAt: '2026-05-14T00:00:00Z',
    })
  })

  it('preserves createdAt and bumps updatedAt on subsequent saves', () => {
    const storage = createInMemoryDiagramStorage({ idGenerator: () => 'd1' })
    let now = '2026-05-14T00:00:00Z'
    const editor = new DiagramEditor({ storage, autosaveMs: 1000, clock: () => now })
    editor.addTable({ name: 'users' })
    vi.advanceTimersByTime(1000)

    now = '2026-05-15T00:00:00Z'
    editor.addTable({ name: 'orders' })
    vi.advanceTimersByTime(1000)
    expect(storage.loadIndex()[0].createdAt).toBe('2026-05-14T00:00:00Z')
    expect(storage.loadIndex()[0].updatedAt).toBe('2026-05-15T00:00:00Z')
  })

  it('skips empty unsaved diagrams (no id, no tables)', () => {
    const storage = createInMemoryDiagramStorage()
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.setDiagramName('Something')
    vi.advanceTimersByTime(1000)
    expect(storage.saves).toBe(0)
  })

  it('does not schedule a save on loadDiagram', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveIndex([{ id: 'd1', name: 'X', tableCount: 1, createdAt: '', updatedAt: '' }])
    const before = storage.saves
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.loadDiagram('d1')
    vi.advanceTimersByTime(1000)
    expect(storage.saves).toBe(before)
  })

  it('does not schedule a save on bootstrap', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveIndex([{ id: 'd1', name: 'X', tableCount: 1, createdAt: '', updatedAt: '' }])
    const before = storage.saves
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.bootstrap()
    vi.advanceTimersByTime(1000)
    expect(storage.saves).toBe(before)
  })

  it('flush() forces pending save immediately', () => {
    const storage = createInMemoryDiagramStorage()
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.addTable({ name: 'users' })
    expect(storage.saves).toBe(0)
    editor.flush()
    expect(storage.saves).toBe(1)
  })

  it('dispose() cancels pending save', () => {
    const storage = createInMemoryDiagramStorage()
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    editor.addTable({ name: 'users' })
    editor.dispose()
    vi.advanceTimersByTime(1000)
    expect(storage.saves).toBe(0)
  })

  it('emits index-changed signal after a save', () => {
    const storage = createInMemoryDiagramStorage()
    const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
    const listener = vi.fn()
    editor.subscribeToIndex(listener)
    editor.addTable({ name: 'users' })
    vi.advanceTimersByTime(1000)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('DiagramEditor.syncDbmlFromDiagram', () => {
  it('writes the generated DBML into dbmlText regardless of dbmlSource', () => {
    const editor = new DiagramEditor({ storage: createInMemoryDiagramStorage() })
    editor.addTable({ name: 'users' })
    editor.setDbmlText('user draft work in progress')
    expect(editor.getDocument().dbmlText).toBe('user draft work in progress')

    editor.syncDbmlFromDiagram()
    expect(editor.getDocument().dbmlText).toMatch(/users/)
  })
})

describe('DiagramEditor.loadFromExportedJson', () => {
  it('returns true and loads the schema with the given name on valid input', () => {
    const editor = new DiagramEditor({ storage: createInMemoryDiagramStorage() })
    const ok = editor.loadFromExportedJson(usersSchema(), 'Imported')
    expect(ok).toBe(true)
    expect(editor.getDocument().diagramId).toBe(null)
    expect(editor.getDocument().diagramName).toBe('Imported')
    expect(editor.getDocument().tableOrder).toEqual(['t1'])
  })

  it('returns false and leaves the document untouched on invalid input', () => {
    const editor = new DiagramEditor({ storage: createInMemoryDiagramStorage() })
    editor.addTable({ name: 'users' })
    const before = editor.getDocument()
    const ok = editor.loadFromExportedJson({ garbage: true }, 'X')
    expect(ok).toBe(false)
    expect(editor.getDocument()).toEqual(before)
  })

  it('schedules an autosave that mints a fresh diagramId', () => {
    vi.useFakeTimers()
    try {
      const storage = createInMemoryDiagramStorage({ idGenerator: () => 'fresh' })
      const editor = new DiagramEditor({ storage, autosaveMs: 1000 })
      editor.loadFromExportedJson(usersSchema(), 'Imported')
      vi.advanceTimersByTime(1000)
      expect(editor.getDocument().diagramId).toBe('fresh')
      expect(storage.loadDiagram('fresh')).not.toBe(null)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('DiagramEditor.bootstrap', () => {
  it('loads the most-recently-updated diagram', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveDiagram('d2', usersSchema())
    storage.saveIndex([
      { id: 'd1', name: 'Old One', tableCount: 1, createdAt: '', updatedAt: '2026-05-01T00:00:00Z' },
      { id: 'd2', name: 'Recent', tableCount: 1, createdAt: '', updatedAt: '2026-05-10T00:00:00Z' },
    ])
    const editor = new DiagramEditor({ storage })
    editor.bootstrap()
    expect(editor.getDocument().diagramId).toBe('d2')
    expect(editor.getDocument().diagramName).toBe('Recent')
  })

  it('is a no-op when the index is empty', () => {
    const editor = new DiagramEditor({ storage: createInMemoryDiagramStorage() })
    const listener = vi.fn()
    editor.subscribe(listener)
    editor.bootstrap()
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('DiagramEditor.loadDiagram', () => {
  it('replaces the document with the stored schema and threads id+name from the index', () => {
    const storage = createInMemoryDiagramStorage()
    storage.saveDiagram('d1', usersSchema())
    storage.saveIndex([
      { id: 'd1', name: 'My Schema', tableCount: 1, createdAt: '2026-05-13T00:00:00Z', updatedAt: '2026-05-13T00:00:00Z' },
    ])
    const editor = new DiagramEditor({ storage })
    editor.loadDiagram('d1')
    const doc = editor.getDocument()
    expect(doc.diagramId).toBe('d1')
    expect(doc.diagramName).toBe('My Schema')
    expect(doc.tableOrder).toEqual(['t1'])
    expect(doc.tables.t1.name).toBe('users')
  })

  it('is a no-op when the id is not in storage', () => {
    const storage = createInMemoryDiagramStorage()
    const editor = new DiagramEditor({ storage })
    const listener = vi.fn()
    editor.subscribe(listener)
    editor.loadDiagram('missing')
    expect(listener).not.toHaveBeenCalled()
    expect(editor.getDocument().diagramId).toBe(null)
  })
})
