import type { DiagramIndexEntry, SqlDialect } from '@/types'

import type { SidePanel } from './types'

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
  | { type: 'LOAD_DIAGRAM'; payload: { diagramId: string; diagramIndex: Array<DiagramIndexEntry>; diagramName: string; tableCount: number } }
  | { type: 'OPEN_DBML_PANEL'; payload: { generatedDbmlText: string } }
  | { type: 'OPEN_DIAGRAM_LIST_PANEL'; payload: { diagramIndex: Array<DiagramIndexEntry> } }
  | { type: 'RENAME_DIAGRAM_DONE'; payload: { diagramIndex: Array<DiagramIndexEntry>; newName?: string } }
  | { type: 'RESTORE_DIAGRAM'; payload: { diagramId: string; diagramIndex: Array<DiagramIndexEntry>; diagramName: string; tableCount: number } }
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
  | { type: 'UPDATE_DBML_FROM_EDITOR'; payload: { errors: Array<{ line: number; message: string }>; tableCount: number } }
  | { type: 'UPDATE_DIAGRAM_INDEX_AFTER_SAVE'; payload: { diagramIndex: Array<DiagramIndexEntry> } }

export const initialDiagramState: DiagramState = {
  activeDiagramId: null,
  activePanel: null,
  dbmlErrors: [],
  dbmlSource: 'diagram',
  dbmlText: '',
  diagramIndex: [],
  diagramName: 'Untitled Diagram',
  editNameValue: '',
  editingName: false,
  importJsonSchemaErrors: [],
  importJsonSchemaMerge: false,
  importJsonSchemaText: '',
  importSqlDialect: 'postgresql',
  importSqlErrors: [],
  importSqlMerge: false,
  importSqlText: '',
  renameValue: '',
  renamingId: null,
  sqlDialect: 'postgresql',
  tableCount: 0,
}

export const diagramReducer = (state: DiagramState, action: DiagramAction): DiagramState => {
  switch (action.type) {
    case 'CLEAR_DIAGRAM':
      return {
        ...state,
        activeDiagramId: null,
        activePanel: null,
        diagramName: action.payload.name,
        tableCount: 0,
      }
    case 'CLOSE_PANEL':
      return { ...state, activePanel: null }
    case 'COMMIT_DIAGRAM_NAME':
      return { ...state, diagramName: action.payload.trimmedName, editingName: false }
    case 'IMPORT_JSON_FILE':
      return {
        ...state,
        activeDiagramId: null,
        activePanel: null,
        diagramName: action.payload.diagramName,
        tableCount: action.payload.tableCount,
      }
    case 'LOAD_DIAGRAM':
      return {
        ...state,
        activeDiagramId: action.payload.diagramId,
        activePanel: null,
        diagramIndex: action.payload.diagramIndex,
        diagramName: action.payload.diagramName,
        tableCount: action.payload.tableCount,
      }
    case 'OPEN_DBML_PANEL':
      return {
        ...state,
        activePanel: 'dbml',
        dbmlErrors: [],
        dbmlSource: 'diagram',
        dbmlText: action.payload.generatedDbmlText,
      }
    case 'OPEN_DIAGRAM_LIST_PANEL':
      return { ...state, activePanel: 'diagram-list', diagramIndex: action.payload.diagramIndex }
    case 'RENAME_DIAGRAM_DONE':
      return {
        ...state,
        diagramIndex: action.payload.diagramIndex,
        diagramName: action.payload.newName ?? state.diagramName,
        renamingId: null,
      }
    case 'RESTORE_DIAGRAM':
      return {
        ...state,
        activeDiagramId: action.payload.diagramId,
        diagramIndex: action.payload.diagramIndex,
        diagramName: action.payload.diagramName,
        tableCount: action.payload.tableCount,
      }
    case 'SET_ACTIVE_DIAGRAM_ID':
      return { ...state, activeDiagramId: action.payload }
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload }
    case 'SET_DBML_ERRORS':
      return { ...state, dbmlErrors: action.payload }
    case 'SET_DBML_SOURCE':
      return { ...state, dbmlSource: action.payload }
    case 'SET_DBML_TEXT':
      return { ...state, dbmlText: action.payload }
    case 'SET_DIAGRAM_INDEX':
      return { ...state, diagramIndex: action.payload }
    case 'SET_EDIT_NAME_VALUE':
      return { ...state, editNameValue: action.payload }
    case 'SET_IMPORT_JSON_SCHEMA_ERRORS':
      return { ...state, importJsonSchemaErrors: action.payload }
    case 'SET_IMPORT_JSON_SCHEMA_MERGE':
      return { ...state, importJsonSchemaMerge: action.payload }
    case 'SET_IMPORT_JSON_SCHEMA_TEXT':
      return { ...state, importJsonSchemaText: action.payload }
    case 'SET_IMPORT_SQL_DIALECT':
      return { ...state, importSqlDialect: action.payload }
    case 'SET_IMPORT_SQL_ERRORS':
      return { ...state, importSqlErrors: action.payload }
    case 'SET_IMPORT_SQL_MERGE':
      return { ...state, importSqlMerge: action.payload }
    case 'SET_IMPORT_SQL_TEXT':
      return { ...state, importSqlText: action.payload }
    case 'SET_RENAME_VALUE':
      return { ...state, renameValue: action.payload }
    case 'SET_RENAMING_ID':
      return { ...state, renamingId: action.payload }
    case 'SET_SQL_DIALECT':
      return { ...state, sqlDialect: action.payload }
    case 'SET_TABLE_COUNT':
      return { ...state, tableCount: action.payload }
    case 'START_EDITING_NAME':
      return { ...state, editNameValue: action.payload.editNameValue, editingName: true }
    case 'START_RENAMING':
      return { ...state, renameValue: action.payload.name, renamingId: action.payload.id }
    case 'STOP_EDITING_NAME':
      return { ...state, editingName: false }
    case 'SYNC_DBML_FROM_DIAGRAM':
      return { ...state, dbmlErrors: [], dbmlSource: 'diagram', dbmlText: action.payload.generatedDbmlText }
    case 'UPDATE_DBML_FROM_EDITOR':
      return { ...state, dbmlErrors: action.payload.errors, tableCount: action.payload.tableCount }
    case 'UPDATE_DIAGRAM_INDEX_AFTER_SAVE':
      return { ...state, diagramIndex: action.payload.diagramIndex }
    default:
      return state
  }
}
