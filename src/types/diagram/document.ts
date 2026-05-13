import type { RelationshipType, TableColumn } from '@/types'

export type TableId = string
export type ColumnId = string
export type RelationId = string

export type ColumnRef = { tableId: TableId; columnId: ColumnId }

export type RelationKind = RelationshipType // '1:1' | '1:N' | 'N:M'

export type EditorTable = {
  id: TableId
  name: string
  columns: Array<TableColumn>
  position: { x: number; y: number }
}

export type EditorRelation = {
  id: RelationId
  source: ColumnRef
  target: ColumnRef
  kind: RelationKind
}

export type DbmlError = { line: number; message: string }

export type ImportResult = {
  tableCount: number
  errors: Array<DbmlError>
}

export type DiagramDocument = {
  diagramId: string | null
  diagramName: string
  tables: Record<TableId, EditorTable>
  tableOrder: Array<TableId>
  relations: Record<RelationId, EditorRelation>
  relationOrder: Array<RelationId>
  dbmlText: string
  dbmlSource: 'diagram' | 'editor'
  dbmlErrors: Array<DbmlError>
}
