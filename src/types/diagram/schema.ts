import type { Edge, Node } from '@xyflow/react'

export type ColumnType =
  | 'BIGINT'
  | 'BLOB'
  | 'BOOLEAN'
  | 'DATE'
  | 'DECIMAL'
  | 'FLOAT'
  | 'INT'
  | 'JSON'
  | 'SERIAL'
  | 'TEXT'
  | 'TIMESTAMP'
  | 'UUID'
  | 'VARCHAR'

export type ColumnConstraint = {
  isForeignKey: boolean
  isNullable: boolean
  isPrimaryKey: boolean
  isUnique: boolean
}

export type TableColumn = {
  constraints: ColumnConstraint
  id: string
  name: string
  type: ColumnType
}

// Pure data: TableNode calls the editor (via useDiagramEditor) with its node
// id, so node data carries no per-render closures.
export type TableNodeData = {
  columns: Array<TableColumn>
  tableName: string
}

export type HandleKind = 'source' | 'target'

export type RelationshipType = '1:1' | '1:N' | 'N:M'

export type RelationshipEdgeData = {
  relationType: RelationshipType
  sourceColumnId: string
  targetColumnId: string
}

export type SqlDialect = 'mysql' | 'postgresql' | 'sqlite'

export type DiagramIndexEntry = {
  createdAt: string
  id: string
  name: string
  tableCount: number
  updatedAt: string
}

export type DiagramSchema = {
  relationships: Array<{
    id: string
    relationType: RelationshipType
    sourceColumnId: string
    sourceTableId: string
    targetColumnId: string
    targetTableId: string
  }>
  tables: Array<{
    columns: Array<TableColumn>
    id: string
    name: string
    position: { x: number; y: number }
  }>
}

export type DiagramStore = {
  diagrams: Record<string, DiagramSchema>
  index: Array<DiagramIndexEntry>
}

// Why a storage write failed: `full` = quota exceeded, `unavailable` = storage
// blocked/disabled (private mode, sandboxed iframe, site data blocked).
export type DiagramStorageFailure = 'full' | 'unavailable'

export type DiagramStorageStatus = 'ok' | DiagramStorageFailure

// Reads (`loadIndex`, `loadDiagram`) never throw — they fall back to empty.
// Writes throw (a DiagramStorageError for the localStorage adapter) and never
// overwrite existing data they could not read first.
export type DiagramStorage = {
  loadIndex(): Array<DiagramIndexEntry>
  saveIndex(index: Array<DiagramIndexEntry>): void
  loadDiagram(id: string): DiagramSchema | null
  saveDiagram(id: string, schema: DiagramSchema): void
  // One read-modify-write that stores the schema and upserts its index entry
  // together; `entry` receives the previous entry (if any). Returns the new index.
  saveDiagramWithIndex(
    id: string,
    schema: DiagramSchema,
    entry: (previous: DiagramIndexEntry | undefined) => DiagramIndexEntry,
  ): Array<DiagramIndexEntry>
  deleteDiagram(id: string): void
  generateId(): string
}

export type SidePanel =
  | 'dbml'
  | 'diagram-list'
  | 'export-mermaid'
  | 'export-sql'
  | 'export-typescript'
  | 'import-json-schema'
  | 'import-sql'
  | null

export type TableNode = Node<TableNodeData, 'tableNode'>

export type RelationshipEdge = Edge<RelationshipEdgeData, 'relationship'>
