import type { ColumnId, ColumnRef, DiagramDocument, EditorRelation, ImportResult, RelationId, RelationKind, SqlDialect, TableColumn, TableId } from '@/types'
import { cloneDocument, createInitialDocument } from './state'
import * as columnOps from './operations/columns'
import * as dbmlOps from './operations/dbml'
import * as exportOps from './operations/export'
import * as importOps from './operations/import'
import * as lifecycleOps from './operations/lifecycle'
import * as relationOps from './operations/relations'
import * as tableOps from './operations/tables'

type Listener = (document: DiagramDocument) => void

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

  constructor(initial?: DiagramDocument) {
    this.document = initial ? cloneDocument(initial) : createInitialDocument()
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
  }

  protected afterStructuralChange(doc: DiagramDocument): DiagramDocument {
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
    this.commit(lifecycleOps.newDiagram())
  }

  setDiagramName(name: string): void {
    this.commit(lifecycleOps.setDiagramName(this.document, name))
  }

  setDbmlText(text: string): void {
    this.commit(dbmlOps.setDbmlText(this.document, text))
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
}
