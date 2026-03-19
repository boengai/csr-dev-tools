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

export type SidePanel =
  | 'dbml'
  | 'diagram-list'
  | 'export-mermaid'
  | 'export-sql'
  | 'export-typescript'
  | 'import-json-schema'
  | 'import-sql'
  | null

export type DiagramState = {
  activeDiagramId: string | null
  activePanel: SidePanel
  dbmlErrors: Array<{ line: number; message: string }>
  dbmlSource: 'diagram' | 'editor'
  dbmlText: string
  diagramIndex: Array<DiagramIndexEntry>
  diagramName: string
  editNameValue: string
  editingName: boolean
  importJsonSchemaErrors: Array<string>
  importJsonSchemaMerge: boolean
  importJsonSchemaText: string
  importSqlDialect: SqlDialect
  importSqlErrors: Array<{ line: number; message: string }>
  importSqlMerge: boolean
  importSqlText: string
  renameValue: string
  renamingId: string | null
  sqlDialect: SqlDialect
  tableCount: number
}

export type DiagramAction =
  | { type: 'CLEAR_DIAGRAM'; payload: { name: string } }
  | { type: 'CLOSE_PANEL' }
  | { type: 'COMMIT_DIAGRAM_NAME'; payload: { trimmedName: string } }
  | { type: 'IMPORT_JSON_FILE'; payload: { diagramName: string; tableCount: number } }
  | {
      type: 'LOAD_DIAGRAM'
      payload: { diagramId: string; diagramIndex: Array<DiagramIndexEntry>; diagramName: string; tableCount: number }
    }
  | { type: 'OPEN_DBML_PANEL'; payload: { generatedDbmlText: string } }
  | { type: 'OPEN_DIAGRAM_LIST_PANEL'; payload: { diagramIndex: Array<DiagramIndexEntry> } }
  | { type: 'RENAME_DIAGRAM_DONE'; payload: { diagramIndex: Array<DiagramIndexEntry>; newName?: string } }
  | {
      type: 'RESTORE_DIAGRAM'
      payload: { diagramId: string; diagramIndex: Array<DiagramIndexEntry>; diagramName: string; tableCount: number }
    }
  | { type: 'SET_ACTIVE_DIAGRAM_ID'; payload: string | null }
  | { type: 'SET_ACTIVE_PANEL'; payload: SidePanel }
  | { type: 'SET_DBML_ERRORS'; payload: Array<{ line: number; message: string }> }
  | { type: 'SET_DBML_SOURCE'; payload: 'diagram' | 'editor' }
  | { type: 'SET_DBML_TEXT'; payload: string }
  | { type: 'SET_DIAGRAM_INDEX'; payload: Array<DiagramIndexEntry> }
  | { type: 'SET_EDIT_NAME_VALUE'; payload: string }
  | { type: 'SET_IMPORT_JSON_SCHEMA_ERRORS'; payload: Array<string> }
  | { type: 'SET_IMPORT_JSON_SCHEMA_MERGE'; payload: boolean }
  | { type: 'SET_IMPORT_JSON_SCHEMA_TEXT'; payload: string }
  | { type: 'SET_IMPORT_SQL_DIALECT'; payload: SqlDialect }
  | { type: 'SET_IMPORT_SQL_ERRORS'; payload: Array<{ line: number; message: string }> }
  | { type: 'SET_IMPORT_SQL_MERGE'; payload: boolean }
  | { type: 'SET_IMPORT_SQL_TEXT'; payload: string }
  | { type: 'SET_RENAME_VALUE'; payload: string }
  | { type: 'SET_RENAMING_ID'; payload: string | null }
  | { type: 'SET_SQL_DIALECT'; payload: SqlDialect }
  | { type: 'SET_TABLE_COUNT'; payload: number }
  | { type: 'START_EDITING_NAME'; payload: { editNameValue: string } }
  | { type: 'START_RENAMING'; payload: { id: string; name: string } }
  | { type: 'STOP_EDITING_NAME' }
  | { type: 'SYNC_DBML_FROM_DIAGRAM'; payload: { generatedDbmlText: string } }
  | {
      type: 'UPDATE_DBML_FROM_EDITOR'
      payload: { errors: Array<{ line: number; message: string }>; tableCount: number }
    }
  | { type: 'UPDATE_DIAGRAM_INDEX_AFTER_SAVE'; payload: { diagramIndex: Array<DiagramIndexEntry> } }

export type TableNode = Node<TableNodeData, 'tableNode'>

export type RelationshipEdge = Edge<RelationshipEdgeData, 'relationship'>
