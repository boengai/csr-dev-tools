import type { ColumnId, DiagramDocument, DiagramIndexEntry, DiagramStorage, RelationId, TableId } from '@/types'

export type DiagramDocumentListener = (document: DiagramDocument) => void

export type DiagramIndexListener = (entries: Array<DiagramIndexEntry>) => void

export type DiagramEditorOptions = {
  storage?: DiagramStorage
  document?: DiagramDocument
  autosaveMs?: number
  clock?: () => string
  idMinters?: EntityIdMinters
}

export type EntityIdMinters = {
  column: () => ColumnId
  relation: () => RelationId
  table: () => TableId
}
