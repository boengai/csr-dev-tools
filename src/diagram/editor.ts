import { validateDiagramSchema } from '@/diagram/codecs/persistence'
import { DiagramStorageError } from '@/diagram/codecs/storage'
import type {
  ColumnId,
  ColumnRef,
  DiagramDocument,
  DiagramDocumentListener,
  DiagramEditorOptions,
  DiagramIndexEntry,
  DiagramIndexListener,
  DiagramStorage,
  DiagramStorageStatus,
  EditorRelation,
  EntityIdMinters,
  ImportResult,
  RelationId,
  RelationKind,
  SqlDialect,
  TableColumn,
  TableId,
} from '@/types'

import { createDefaultIdMinters } from './id-minters'
import * as columnOps from './operations/columns'
import * as dbmlOps from './operations/dbml'
import * as exportOps from './operations/export'
import * as importOps from './operations/import'
import * as lifecycleOps from './operations/lifecycle'
import * as relationOps from './operations/relations'
import * as tableOps from './operations/tables'
import { cloneDocument, createInitialDocument } from './state'
import { localStorageDiagramStorage } from './storage'

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
  private listeners: Set<DiagramDocumentListener> = new Set()
  private indexListeners: Set<DiagramIndexListener> = new Set()
  private storage: DiagramStorage
  private autosaveMs: number
  private clock: () => string
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null
  private idMinters: EntityIdMinters
  private storageStatus: DiagramStorageStatus = 'ok'

  constructor(options: DiagramEditorOptions = {}) {
    this.storage = options.storage ?? localStorageDiagramStorage
    this.document = options.document ? cloneDocument(options.document) : createInitialDocument()
    this.autosaveMs = options.autosaveMs ?? 3000
    this.clock = options.clock ?? (() => new Date().toISOString())
    this.idMinters = options.idMinters ?? createDefaultIdMinters()
  }

  listDiagrams(): Array<DiagramIndexEntry> {
    return this.storage.loadIndex()
  }

  // 'ok' until a storage write fails; reset by the next successful write.
  // Changes are announced through the index listeners.
  getStorageStatus(): DiagramStorageStatus {
    return this.storageStatus
  }

  subscribeToIndex(listener: DiagramIndexListener): () => void {
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
    this.applyLifecycle({ ...next, diagramId: id, diagramName: entry?.name ?? next.diagramName })
  }

  deleteDiagram(id: string): void {
    if (!this.tryStorageWrite(() => this.storage.deleteDiagram(id))) {
      this.notifyIndex()
      return
    }
    if (this.document.diagramId === id) {
      this.applyLifecycle(createInitialDocument())
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
    if (!this.tryStorageWrite(() => this.storage.saveIndex(idx))) {
      this.notifyIndex()
      return
    }
    if (this.document.diagramId === id) {
      this.applyLifecycle({ ...this.document, diagramName: trimmed })
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

  subscribe(listener: DiagramDocumentListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  replaceDocument(next: DiagramDocument): void {
    this.applyLifecycle(isValidDocument(next) ? cloneDocument(next) : createInitialDocument())
  }

  protected commit(next: DiagramDocument): void {
    this.document = next
    this.notify()
    this.scheduleAutosave()
  }

  // The lifecycle channel: replace the document and notify, but do not
  // schedule autosave or run afterStructuralChange. Routed through by
  // load/new/delete/rename/replace — these represent navigation between
  // diagrams, not user edits, so they must not bump updatedAt or rewrite
  // generated DBML.
  private applyLifecycle(next: DiagramDocument): void {
    this.document = next
    this.notify()
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
    const now = this.clock()
    const name = this.document.diagramName
    const tableCount = this.document.tableOrder.length
    const savedId = id
    let index: Array<DiagramIndexEntry> | undefined
    // Runs inside a timer: a throw here would be uncaught and the edit lost
    // silently, so failures become a storage status the UI can show instead.
    // The document stays in memory; the next edit retries the save.
    this.tryStorageWrite(() => {
      index = this.storage.saveDiagramWithIndex(savedId, schema, (previous) => ({
        id: savedId,
        name,
        tableCount,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      }))
    })
    this.notifyIndex(index)
  }

  // Runs a storage write, recording success/failure in storageStatus.
  private tryStorageWrite(write: () => void): boolean {
    try {
      write()
      this.storageStatus = 'ok'
      return true
    } catch (error) {
      this.storageStatus = error instanceof DiagramStorageError ? error.reason : 'unavailable'
      return false
    }
  }

  protected afterStructuralChange(doc: DiagramDocument): DiagramDocument {
    // When the user is hand-editing DBML (source='editor'), preserve their draft.
    // Re-syncing the generated DBML happens explicitly via the "Sync from Diagram"
    // button (which calls setDbmlText(editor.toDbml())). Without this guard, every
    // structural mutation silently overwrites in-progress DBML edits.
    if (doc.dbmlSource === 'editor') return doc
    return dbmlOps.regenerateDbmlFromDocument(doc)
  }

  // The single channel for structural document mutations. Threads idMinters,
  // runs afterStructuralChange, and commits only when the document changed.
  // Ops may return either a bare DiagramDocument or { document, result } — the
  // wrapper passes `result` back to the caller even on the no-op branch (op
  // returned the same doc) so import ops can surface their error result without
  // a successful commit.
  private commitStructural(op: (doc: DiagramDocument, minters: EntityIdMinters) => DiagramDocument): void
  private commitStructural<R>(
    op: (doc: DiagramDocument, minters: EntityIdMinters) => { document: DiagramDocument; result: R },
  ): R
  private commitStructural<R>(
    op: (doc: DiagramDocument, minters: EntityIdMinters) => DiagramDocument | { document: DiagramDocument; result: R },
  ): R | undefined {
    const out = op(this.document, this.idMinters)
    const next = 'document' in out ? out.document : out
    const result = 'result' in out ? out.result : undefined
    if (next !== this.document) this.commit(this.afterStructuralChange(next))
    return result
  }

  addTable(input: { name: string; position?: { x: number; y: number } }): TableId {
    return this.commitStructural((doc, m) => {
      const { document, id } = tableOps.addTable(doc, input, m)
      return { document, result: id }
    })
  }

  renameTable(id: TableId, name: string): void {
    this.commitStructural((doc) => tableOps.renameTable(doc, id, name))
  }

  moveTable(id: TableId, position: { x: number; y: number }): void {
    this.commitStructural((doc) => tableOps.moveTable(doc, id, position))
  }

  deleteTable(id: TableId): void {
    this.commitStructural((doc) => tableOps.deleteTable(doc, id))
  }

  addColumn(tableId: TableId, column: Omit<TableColumn, 'id'>): ColumnId | null {
    return this.commitStructural((doc, m) => {
      const { document, id } = columnOps.addColumn(doc, tableId, column, m)
      return { document, result: id }
    })
  }

  updateColumn(tableId: TableId, columnId: ColumnId, patch: Partial<TableColumn>): void {
    this.commitStructural((doc) => columnOps.updateColumn(doc, tableId, columnId, patch))
  }

  deleteColumn(tableId: TableId, columnId: ColumnId): void {
    this.commitStructural((doc) => columnOps.deleteColumn(doc, tableId, columnId))
  }

  addRelation(input: { from: ColumnRef; to: ColumnRef; kind: RelationKind }): RelationId | null {
    return this.commitStructural((doc, m) => {
      const { document, id } = relationOps.addRelation(doc, input, m)
      return { document, result: id }
    })
  }

  updateRelation(id: RelationId, patch: Partial<Omit<EditorRelation, 'id'>>): void {
    this.commitStructural((doc) => relationOps.updateRelation(doc, id, patch))
  }

  deleteRelation(id: RelationId): void {
    this.commitStructural((doc) => relationOps.deleteRelation(doc, id))
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
    this.applyLifecycle({ ...lifecycleOps.newDiagram(), diagramName: name })
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
    return this.commitStructural((doc, m) => dbmlOps.applyDbmlNow(doc, m))
  }

  importFromSql(text: string, dialect: SqlDialect, opts?: { merge?: boolean }): ImportResult {
    return this.commitStructural((doc, m) => importOps.importFromSql(doc, text, dialect, m, opts))
  }

  importFromJsonSchema(text: string, opts?: { merge?: boolean }): ImportResult {
    return this.commitStructural((doc, m) => importOps.importFromJsonSchema(doc, text, m, opts))
  }

  getDbmlSource(): 'diagram' | 'editor' {
    return this.document.dbmlSource
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.document)
  }

  private notifyIndex(snapshot: Array<DiagramIndexEntry> = this.storage.loadIndex()): void {
    for (const listener of this.indexListeners) listener(snapshot)
  }
}
