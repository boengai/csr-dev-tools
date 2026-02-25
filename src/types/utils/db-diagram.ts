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

export type TableNodeData = {
  columns: Array<TableColumn>
  onAddColumn: () => void
  onColumnChange: (columnId: string, updates: Partial<TableColumn>) => void
  onDeleteColumn: (columnId: string) => void
  onDeleteTable: () => void
  onTableNameChange: (name: string) => void
  tableName: string
}

export type RelationshipType = '1:1' | '1:N' | 'N:M'

export type RelationshipEdgeData = {
  relationType: RelationshipType
  sourceColumnId: string
  targetColumnId: string
}

// Forward-compatible schema type — defined now for Story 27.2 persistence.
// Not used in 27.1 implementation. Do NOT implement serialization in this story.
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
