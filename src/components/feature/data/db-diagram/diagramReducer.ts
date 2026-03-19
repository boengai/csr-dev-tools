import type { DiagramAction, DiagramState } from '@/types'

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
