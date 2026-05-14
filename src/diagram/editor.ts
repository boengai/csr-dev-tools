import type { ColumnId, ColumnRef, DiagramDocument, DiagramIndexEntry, DiagramStorage, EditorRelation, ImportResult, RelationId, RelationKind, SqlDialect, TableColumn, TableId } from '@/types'
import { cloneDocument, createInitialDocument } from './state'
import * as columnOps from './operations/columns'
import * as dbmlOps from './operations/dbml'
import * as exportOps from './operations/export'
import * as importOps from './operations/import'
import * as lifecycleOps from './operations/lifecycle'
import * as relationOps from './operations/relations'
import * as tableOps from './operations/tables'
import { localStorageDiagramStorage } from './storage'
import { validateDiagramSchema } from '@/utils/db-diagram-persistence'

type Listener = (document: DiagramDocument) => void
type IndexListener = (entries: Array<DiagramIndexEntry>) => void

type DiagramEditorOptions = {
  storage?: DiagramStorage
  document?: DiagramDocument
  autosaveMs?: number
  clock?: () => string
}

const isValidDocument = (value: unknown): value is DiagramDocument => {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.diagramName === 'string' &&
    typeof v.tables === 'object' &&
    typeof v.relations === 'object' &&
    Array.isArray(v.tableOrder) &&
    Array.isArray(v.relationOrder)
  )
}

export class DiagramEditor {
  private document: DiagramDocument
  private listeners: Set<Listener> = new Set()
  private indexListeners: Set<IndexListener> = new Set()
  private storage: DiagramStorage
  private autosaveMs: number
  private clock: () => string
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: DiagramEditorOptions = {}) {
    this.storage = options.storage ?? localStorageDiagramStorage
    this.document = options.document ? cloneDocument(options.document) : createInitialDocument()
    this.autosaveMs = options.autosaveMs ?? 3000
    this.clock = options.clock ?? (() => new Date().toISOString())
  }

  listDiagrams(): Array<DiagramIndexEntry> {
    return this.storage.loadIndex()
  }

  subscribeToIndex(listener: IndexListener): () => void {
    this.indexListeners.add(listener)
    return () => {
      this.indexListeners.delete(listener)
    }
  }

  loadDiagram(id: string): void {
    const schema = this.storage.loadDiagram(id)
    if (!schema) return
    const entry = this.storage.loadIndex().find((e) => e.id === id)
    const next = lifecycleOps.schemaToDocument(schema, createInitialDocument())
    this.document = { ...next, diagramId: id, diagramName: entry?.name ?? next.diagramName }
    this.notify()
  }

  deleteDiagram(id: string): void {
    this.storage.deleteDiagram(id)
    if (this.document.diagramId === id) {
      this.document = createInitialDocument()
      this.notify()
    }
    this.notifyIndex()
  }

  renameDiagram(id: string, name: string): void {
    const trimmed = name.trim()
    if (!trimmed) return
    const idx = this.storage.loadIndex()
    const entry = idx.find((e) => e.id === id)
    if (!entry) return
    entry.name = trimmed
    this.storage.saveIndex(idx)
    if (this.document.diagramId === id) {
      this.document = { ...this.document, diagramName: trimmed }
      this.notify()
    }
    this.notifyIndex()
  }

  bootstrap(): void {
    const idx = this.storage.loadIndex()
    if (idx.length === 0) return
    const latest = [...idx].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    this.loadDiagram(latest.id)
  }

  getDocument(): DiagramDocument {
    return this.document
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  replaceDocument(next: DiagramDocument): void {
    if (!isValidDocument(next)) {
      this.document = createInitialDocument()
    } else {
      this.document = cloneDocument(next)
    }
    this.notify()
  }

  protected commit(next: DiagramDocument): void {
    this.document = next
    this.notify()
    this.scheduleAutosave()
  }

  flush(): void {
    if (this.autosaveTimer === null) return
    clearTimeout(this.autosaveTimer)
    this.autosaveTimer = null
    this.performAutosave()
  }

  dispose(): void {
    if (this.autosaveTimer !== null) {
      clearTimeout(this.autosaveTimer)
      this.autosaveTimer = null
    }
    this.listeners.clear()
    this.indexListeners.clear()
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer !== null) clearTimeout(this.autosaveTimer)
    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = null
      this.performAutosave()
    }, this.autosaveMs)
  }

  private performAutosave(): void {
    const doc = this.document
    if (!doc.diagramId && doc.tableOrder.length === 0) return

    let id = doc.diagramId
    if (!id) {
      id = this.storage.generateId()
      this.document = { ...doc, diagramId: id }
      this.notify()
    }

    const schema = exportOps.documentToSchema(this.document)
    this.storage.saveDiagram(id, schema)

    const now = this.clock()
    const idx = this.storage.loadIndex()
    const existing = idx.findIndex((e) => e.id === id)
    const entry: DiagramIndexEntry = {
      id,
      name: this.document.diagramName,
      tableCount: this.document.tableOrder.length,
      createdAt: existing >= 0 ? idx[existing].createdAt : now,
      updatedAt: now,
    }
    if (existing >= 0) idx[existing] = entry
    else idx.push(entry)
    this.storage.saveIndex(idx)
    this.notifyIndex()
  }

  protected afterStructuralChange(doc: DiagramDocument): DiagramDocument {
    // When the user is hand-editing DBML (source='editor'), preserve their draft.
    // Re-syncing the generated DBML happens explicitly via the "Sync from Diagram"
    // button (which calls setDbmlText(editor.toDbml())). Without this guard, every
    // structural mutation silently overwrites in-progress DBML edits.
    if (doc.dbmlSource === 'editor') return doc
    return dbmlOps.regenerateDbmlFromDocument(doc)
  }

  addTable(input: { name: string; position?: { x: number; y: number } }): TableId {
    const { document, id } = tableOps.addTable(this.document, input)
    this.commit(this.afterStructuralChange(document))
    return id
  }

  renameTable(id: TableId, name: string): void {
    const next = tableOps.renameTable(this.document, id, name)
    if (next === this.document) return
    this.commit(this.afterStructuralChange(next))
  }

  moveTable(id: TableId, position: { x: number; y: number }): void {
    const next = tableOps.moveTable(this.document, id, position)
    if (next === this.document) return
    this.commit(this.afterStructuralChange(next))
  }

  deleteTable(id: TableId): void {
    const next = tableOps.deleteTable(this.document, id)
    if (next === this.document) return
    this.commit(this.afterStructuralChange(next))
  }

  addColumn(tableId: TableId, column: Omit<TableColumn, 'id'>): ColumnId | null {
    const { document, id } = columnOps.addColumn(this.document, tableId, column)
    if (document === this.document) return null
    this.commit(this.afterStructuralChange(document))
    return id
  }

  updateColumn(tableId: TableId, columnId: ColumnId, patch: Partial<TableColumn>): void {
    const next = columnOps.updateColumn(this.document, tableId, columnId, patch)
    if (next === this.document) return
    this.commit(this.afterStructuralChange(next))
  }

  deleteColumn(tableId: TableId, columnId: ColumnId): void {
    const next = columnOps.deleteColumn(this.document, tableId, columnId)
    if (next === this.document) return
    this.commit(this.afterStructuralChange(next))
  }

  addRelation(input: { from: ColumnRef; to: ColumnRef; kind: RelationKind }): RelationId | null {
    const { document, id } = relationOps.addRelation(this.document, input)
    if (document === this.document) return null
    this.commit(this.afterStructuralChange(document))
    return id
  }

  updateRelation(id: RelationId, patch: Partial<Omit<EditorRelation, 'id'>>): void {
    const next = relationOps.updateRelation(this.document, id, patch)
    if (next === this.document) return
    this.commit(this.afterStructuralChange(next))
  }

  deleteRelation(id: RelationId): void {
    const next = relationOps.deleteRelation(this.document, id)
    if (next === this.document) return
    this.commit(this.afterStructuralChange(next))
  }

  toDbml(): string {
    return exportOps.toDbml(this.document)
  }

  toSql(dialect: SqlDialect): string {
    return exportOps.toSql(this.document, dialect)
  }

  toMermaid(): string {
    return exportOps.toMermaid(this.document)
  }

  toTypeScript(): string {
    return exportOps.toTypeScript(this.document)
  }

  newDiagram(): void {
    const existing = new Set(this.storage.loadIndex().map((entry) => entry.name))
    const base = 'Untitled Diagram'
    let name = base
    let n = 1
    while (existing.has(name)) {
      n++
      name = `${base} ${n}`
    }
    this.document = { ...lifecycleOps.newDiagram(), diagramName: name }
    this.notify()
  }

  setDiagramName(name: string): void {
    this.commit(lifecycleOps.setDiagramName(this.document, name))
  }

  setDbmlText(text: string): void {
    this.commit(dbmlOps.setDbmlText(this.document, text))
  }

  syncDbmlFromDiagram(): void {
    const dbml = exportOps.toDbml(this.document)
    this.commit(dbmlOps.setDbmlText(this.document, dbml))
  }

  loadFromExportedJson(parsed: unknown, name: string): boolean {
    if (!validateDiagramSchema(parsed)) return false
    const base = { ...createInitialDocument(), diagramName: name }
    const doc = lifecycleOps.schemaToDocument(parsed, base)
    this.commit({ ...doc, diagramId: null, diagramName: name })
    return true
  }

  applyDbmlNow(): ImportResult {
    const { document, result } = dbmlOps.applyDbmlNow(this.document)
    this.commit(document)
    return result
  }

  importFromSql(text: string, dialect: SqlDialect): ImportResult {
    const { document, result } = importOps.importFromSql(this.document, text, dialect)
    if (document !== this.document) this.commit(this.afterStructuralChange(document))
    return result
  }

  importFromJsonSchema(text: string): ImportResult {
    const { document, result } = importOps.importFromJsonSchema(this.document, text)
    if (document !== this.document) this.commit(this.afterStructuralChange(document))
    return result
  }

  getDbmlSource(): 'diagram' | 'editor' {
    return this.document.dbmlSource
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.document)
  }

  private notifyIndex(): void {
    const snapshot = this.storage.loadIndex()
    for (const listener of this.indexListeners) listener(snapshot)
  }
}
