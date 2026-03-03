import type { Connection } from '@xyflow/react'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { addEdge, useReactFlow, useUpdateNodeInternals } from '@xyflow/react'
import { useCallback, useEffect, useMemo } from 'react'

import type {
  DiagramIndexEntry,
  RelationshipEdgeData,
  RelationshipType,
  SqlDialect,
  TableColumn,
} from '@/types'

import { useDebounceCallback, useToast } from '@/hooks'
import {
  createDefaultColumn,
  createDefaultTable,
  deleteDiagram,
  deserializeDiagram,
  downloadTextFile,
  generateDbml,
  generateDiagramId,
  generateId,
  generateMermaidER,
  generateSql,
  generateTypeScript,
  gridLayoutPositions,
  loadDiagram,
  loadDiagramIndex,
  parseDbml,
  parseJsonSchema,
  parseSqlDdl,
  saveDiagram,
  saveDiagramIndex,
  serializeDiagram,
  validateDiagramSchema,
} from '@/utils'

import type { RelationshipEdge } from './RelationshipEdge'
import type { TableNode } from './TableNode'
import type { SidePanel } from './types'
import type { DiagramAction, DiagramState } from './diagramReducer'

const MERMAID_PREFILL_KEY = 'csr-dev-tools-mermaid-renderer-prefill'

type UseDiagramHandlersArgs = {
  dispatch: Dispatch<DiagramAction>
  edges: Array<RelationshipEdge>
  nameInputRef: RefObject<HTMLInputElement | null>
  nodes: Array<TableNode>
  renameInputRef: RefObject<HTMLInputElement | null>
  setEdges: Dispatch<SetStateAction<Array<RelationshipEdge>>>
  setNodes: Dispatch<SetStateAction<Array<TableNode>>>
  state: DiagramState
}

export const useDiagramHandlers = ({
  dispatch,
  edges,
  nameInputRef,
  nodes,
  renameInputRef,
  setEdges,
  setNodes,
  state,
}: UseDiagramHandlersArgs) => {
  const { screenToFlowPosition, fitView } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const { toast } = useToast()

  // -------------------------------------------------------------------------
  // Mount: restore last updated diagram
  // -------------------------------------------------------------------------
  useEffect(() => {
    const idx = loadDiagramIndex()

    if (idx.length > 0) {
      const latest = [...idx].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      const schema = loadDiagram(latest.id)
      if (schema) {
        const { edges: restoredEdges, nodes: restoredNodes } = deserializeDiagram(schema)
        setNodes(restoredNodes as Array<TableNode>)
        setEdges(restoredEdges as Array<RelationshipEdge>)
        dispatch({
          type: 'RESTORE_DIAGRAM',
          payload: {
            diagramId: latest.id,
            diagramIndex: idx,
            diagramName: latest.name,
            tableCount: restoredNodes.length,
          },
        })
        setTimeout(() => {
          updateNodeInternals(restoredNodes.map((n) => n.id))
          fitView({ padding: 0.2 })
        }, 100)
      } else {
        dispatch({ type: 'SET_DIAGRAM_INDEX', payload: idx })
      }
    } else {
      dispatch({ type: 'SET_DIAGRAM_INDEX', payload: idx })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Window event listeners for edge component communication
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handler = (e: Event) => {
      const { edgeId, relationType } = (e as CustomEvent<{ edgeId: string; relationType: RelationshipType }>).detail
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId ? { ...edge, data: { ...edge.data, relationType } as RelationshipEdgeData } : edge,
        ),
      )
    }
    window.addEventListener('db-diagram-relation-change', handler)
    return () => window.removeEventListener('db-diagram-relation-change', handler)
  }, [setEdges])

  useEffect(() => {
    const handler = (e: Event) => {
      const { edgeId } = (e as CustomEvent<{ edgeId: string }>).detail
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
    }
    window.addEventListener('db-diagram-edge-delete', handler)
    return () => window.removeEventListener('db-diagram-edge-delete', handler)
  }, [setEdges])

  // -------------------------------------------------------------------------
  // Autosave
  // -------------------------------------------------------------------------
  const performSave = useCallback(() => {
    if (nodes.length === 0 && !state.activeDiagramId) return

    let id = state.activeDiagramId
    if (!id) {
      id = generateDiagramId()
      dispatch({ type: 'SET_ACTIVE_DIAGRAM_ID', payload: id })
    }

    const schema = serializeDiagram(nodes, edges)
    try {
      saveDiagram(id, schema)
    } catch {
      toast({ action: 'add', item: { label: 'Failed to save diagram. localStorage may be full.', type: 'error' } })
      return
    }

    const now = new Date().toISOString()
    const idx = loadDiagramIndex()
    const existing = idx.findIndex((e) => e.id === id)
    const entry: DiagramIndexEntry = {
      createdAt: existing >= 0 ? idx[existing].createdAt : now,
      id: id!,
      name: state.diagramName,
      tableCount: nodes.length,
      updatedAt: now,
    }

    if (existing >= 0) {
      idx[existing] = entry
    } else {
      idx.push(entry)
    }
    saveDiagramIndex(idx)
    dispatch({ type: 'UPDATE_DIAGRAM_INDEX_AFTER_SAVE', payload: { diagramIndex: idx } })

    toast({ action: 'add', item: { label: 'Diagram saved', type: 'success' } })
  }, [nodes, edges, state.activeDiagramId, state.diagramName, toast, dispatch])

  const debouncedSave = useDebounceCallback(performSave, 3000)

  useEffect(() => {
    debouncedSave()
  }, [nodes, edges, debouncedSave])

  // -------------------------------------------------------------------------
  // Derived/generated values (memos)
  // -------------------------------------------------------------------------
  const generatedSql = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateSql(schema, state.sqlDialect)
  }, [nodes, edges, state.sqlDialect])

  const generatedMermaid = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateMermaidER(schema)
  }, [nodes, edges])

  const generatedTypescript = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateTypeScript(schema)
  }, [nodes, edges])

  const generatedDbmlText = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateDbml(schema)
  }, [nodes, edges])

  // Sync diagram -> DBML editor when source is diagram
  useEffect(() => {
    if (state.dbmlSource === 'diagram' && state.activePanel === 'dbml') {
      dispatch({ type: 'SYNC_DBML_FROM_DIAGRAM', payload: { generatedDbmlText } })
    }
  }, [generatedDbmlText, state.dbmlSource, state.activePanel, dispatch])

  // -------------------------------------------------------------------------
  // DBML handlers
  // -------------------------------------------------------------------------
  const applyDbml = useCallback(
    (text: string) => {
      if (!text.trim()) return

      const result = parseDbml(text)

      if (result.tables.length === 0) {
        dispatch({ type: 'SET_DBML_ERRORS', payload: result.errors })
        return
      }

      const { edges: newEdges, nodes: newNodes } = deserializeDiagram({
        relationships: result.relationships,
        tables: result.tables,
      })

      setNodes(newNodes as Array<TableNode>)
      setEdges(newEdges as Array<RelationshipEdge>)
      dispatch({ type: 'UPDATE_DBML_FROM_EDITOR', payload: { errors: result.errors, tableCount: result.tables.length } })
    },
    [setNodes, setEdges, dispatch],
  )

  const debouncedApplyDbml = useDebounceCallback(applyDbml, 500)

  const handleDbmlChange = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_DBML_SOURCE', payload: 'editor' })
      dispatch({ type: 'SET_DBML_TEXT', payload: text })
      debouncedApplyDbml(text)
    },
    [debouncedApplyDbml, dispatch],
  )

  // -------------------------------------------------------------------------
  // Table / column handlers
  // -------------------------------------------------------------------------
  const handleAddTable = useCallback(() => {
    const { columns, tableName } = createDefaultTable(state.tableCount)
    const offset = state.tableCount * 30
    const position = screenToFlowPosition({
      x: window.innerWidth / 2 + offset,
      y: window.innerHeight / 2 + offset,
    })
    const noop = () => {}
    const newNode: TableNode = {
      data: {
        columns,
        onAddColumn: noop,
        onColumnChange: noop,
        onDeleteColumn: noop,
        onDeleteTable: noop,
        onTableNameChange: noop,
        tableName,
      },
      id: generateId(),
      position,
      type: 'tableNode',
    }
    setNodes((nds) => [...nds, newNode])
    dispatch({ type: 'SET_TABLE_COUNT', payload: state.tableCount + 1 })
  }, [screenToFlowPosition, setNodes, state.tableCount, dispatch])

  const handleDeleteTable = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    },
    [setNodes, setEdges],
  )

  const handleTableNameChange = useCallback(
    (nodeId: string, name: string) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, tableName: name } } : n)))
    },
    [setNodes],
  )

  const handleAddColumn = useCallback(
    (nodeId: string) => {
      const col = createDefaultColumn('column')
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, columns: [...n.data.columns, col] } } : n)),
      )
    },
    [setNodes],
  )

  const handleColumnChange = useCallback(
    (nodeId: string, columnId: string, updates: Partial<TableColumn>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  columns: n.data.columns.map((c) =>
                    c.id === columnId
                      ? { ...c, ...updates, constraints: { ...c.constraints, ...updates.constraints } }
                      : c,
                  ),
                },
              }
            : n,
        ),
      )
    },
    [setNodes],
  )

  const handleDeleteColumn = useCallback(
    (nodeId: string, columnId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, columns: n.data.columns.filter((c) => c.id !== columnId) } } : n,
        ),
      )
      const sourceHandle = `${nodeId}-${columnId}-source`
      const targetHandle = `${nodeId}-${columnId}-target`
      setEdges((eds) => eds.filter((e) => e.sourceHandle !== sourceHandle && e.targetHandle !== targetHandle))
    },
    [setNodes, setEdges],
  )

  const handleRearrange = useCallback(() => {
    setNodes((nds) => {
      const positions = gridLayoutPositions(nds.length)
      return nds.map((node, i) => ({ ...node, position: positions[i] }))
    })
    setTimeout(() => fitView({ padding: 0.2 }), 50)
  }, [setNodes, fitView])

  const nodesWithCallbacks = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onAddColumn: () => handleAddColumn(node.id),
      onColumnChange: (columnId: string, updates: Partial<TableColumn>) =>
        handleColumnChange(node.id, columnId, updates),
      onDeleteColumn: (columnId: string) => handleDeleteColumn(node.id, columnId),
      onDeleteTable: () => handleDeleteTable(node.id),
      onTableNameChange: (name: string) => handleTableNameChange(node.id, name),
    },
  }))

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        data: {
          relationType: '1:N' as RelationshipType,
          sourceColumnId: connection.sourceHandle ?? '',
          targetColumnId: connection.targetHandle ?? '',
        },
        type: 'relationship',
      }
      setEdges((eds) => addEdge(edge, eds) as Array<RelationshipEdge>)
    },
    [setEdges],
  )

  // -------------------------------------------------------------------------
  // Diagram management handlers
  // -------------------------------------------------------------------------
  const handleLoadDiagram = useCallback(
    (id: string) => {
      const schema = loadDiagram(id)
      if (!schema) {
        toast({ action: 'add', item: { label: 'Failed to load diagram.', type: 'error' } })
        return
      }
      const { edges: newEdges, nodes: newNodes } = deserializeDiagram(schema)
      setNodes(newNodes as Array<TableNode>)
      setEdges(newEdges as Array<RelationshipEdge>)
      const entry = state.diagramIndex.find((e) => e.id === id)
      dispatch({
        type: 'LOAD_DIAGRAM',
        payload: {
          diagramId: id,
          diagramIndex: state.diagramIndex,
          diagramName: entry?.name ?? state.diagramName,
          tableCount: newNodes.length,
        },
      })
      setTimeout(() => {
        updateNodeInternals(newNodes.map((n) => n.id))
        fitView({ padding: 0.2 })
      }, 100)
    },
    [state.diagramIndex, state.diagramName, setNodes, setEdges, fitView, updateNodeInternals, toast, dispatch],
  )

  const handleNewDiagram = useCallback(() => {
    const idx = loadDiagramIndex()
    let num = 1
    const baseName = 'Untitled Diagram'
    const existingNames = new Set(idx.map((e) => e.name))
    let name = baseName
    while (existingNames.has(name)) {
      num++
      name = `${baseName} ${num}`
    }

    setNodes([])
    setEdges([])
    dispatch({ type: 'CLEAR_DIAGRAM', payload: { name } })
  }, [setNodes, setEdges, dispatch])

  const handleDeleteDiagram = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this diagram? This cannot be undone.')) return
      deleteDiagram(id)
      const newIndex = loadDiagramIndex()
      if (state.activeDiagramId === id) {
        setNodes([])
        setEdges([])
        dispatch({ type: 'CLEAR_DIAGRAM', payload: { name: 'Untitled Diagram' } })
      }
      dispatch({ type: 'SET_DIAGRAM_INDEX', payload: newIndex })
    },
    [state.activeDiagramId, setNodes, setEdges, dispatch],
  )

  const handleRenameDiagram = useCallback(
    (id: string, newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed) return
      const idx = loadDiagramIndex()
      const entry = idx.find((e) => e.id === id)
      if (entry) {
        entry.name = trimmed
        saveDiagramIndex(idx)
        dispatch({
          type: 'RENAME_DIAGRAM_DONE',
          payload: {
            diagramIndex: [...idx],
            newName: state.activeDiagramId === id ? trimmed : undefined,
          },
        })
      } else {
        dispatch({ type: 'SET_RENAMING_ID', payload: null })
      }
    },
    [state.activeDiagramId, dispatch],
  )

  const handleDiagramNameCommit = useCallback(() => {
    const trimmed = state.editNameValue.trim()
    if (trimmed && trimmed !== state.diagramName) {
      dispatch({ type: 'COMMIT_DIAGRAM_NAME', payload: { trimmedName: trimmed } })
      if (state.activeDiagramId) {
        const idx = loadDiagramIndex()
        const entry = idx.find((e) => e.id === state.activeDiagramId)
        if (entry) {
          entry.name = trimmed
          saveDiagramIndex(idx)
          dispatch({ type: 'SET_DIAGRAM_INDEX', payload: [...idx] })
        }
      }
    } else {
      dispatch({ type: 'STOP_EDITING_NAME' })
    }
  }, [state.editNameValue, state.diagramName, state.activeDiagramId, dispatch])

  // -------------------------------------------------------------------------
  // Export / import handlers
  // -------------------------------------------------------------------------
  const handleDownloadSql = useCallback(() => {
    if (!generatedSql) return
    const safeName = state.diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadTextFile(generatedSql, `${safeName}-${state.sqlDialect}.sql`, 'application/sql')
  }, [generatedSql, state.diagramName, state.sqlDialect])

  const handleExportJson = useCallback(() => {
    if (nodes.length === 0) return
    const schema = serializeDiagram(nodes, edges)
    const jsonStr = JSON.stringify(schema, null, 2)
    const safeName = state.diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadTextFile(jsonStr, `${safeName}.json`, 'application/json')
  }, [nodes, edges, state.diagramName])

  const handleImportJson = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string)
          if (!validateDiagramSchema(parsed)) {
            toast({
              action: 'add',
              item: { label: 'Invalid diagram file. Expected a CSR Dev Tools diagram JSON.', type: 'error' },
            })
            return
          }
          const { edges: newEdges, nodes: newNodes } = deserializeDiagram(parsed)
          setNodes(newNodes as Array<TableNode>)
          setEdges(newEdges as Array<RelationshipEdge>)
          dispatch({
            type: 'IMPORT_JSON_FILE',
            payload: {
              diagramName: file.name.replace(/\.json$/i, ''),
              tableCount: newNodes.length,
            },
          })
          setTimeout(() => {
            updateNodeInternals(newNodes.map((n) => n.id))
            fitView({ padding: 0.2 })
          }, 100)
        } catch {
          toast({
            action: 'add',
            item: { label: 'Invalid diagram file. Expected a CSR Dev Tools diagram JSON.', type: 'error' },
          })
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [setNodes, setEdges, fitView, updateNodeInternals, toast, dispatch],
  )

  const handleImportSql = useCallback(() => {
    if (!state.importSqlText.trim()) return

    const result = parseSqlDdl(state.importSqlText, state.importSqlDialect)
    dispatch({ type: 'SET_IMPORT_SQL_ERRORS', payload: result.errors })

    if (result.tables.length === 0) {
      toast({ action: 'add', item: { label: 'No valid CREATE TABLE statements found.', type: 'error' } })
      return
    }

    const { edges: newEdges, nodes: newNodes } = deserializeDiagram({
      relationships: result.relationships,
      tables: result.tables,
    })

    if (state.importSqlMerge) {
      setNodes((nds) => [...nds, ...(newNodes as Array<TableNode>)])
      setEdges((eds) => [...eds, ...(newEdges as Array<RelationshipEdge>)])
    } else {
      setNodes(newNodes as Array<TableNode>)
      setEdges(newEdges as Array<RelationshipEdge>)
    }

    dispatch({ type: 'SET_TABLE_COUNT', payload: state.tableCount + result.tables.length })
    setTimeout(() => {
      updateNodeInternals(newNodes.map((n) => n.id))
      fitView({ padding: 0.2 })
    }, 100)

    const errorCount = result.errors.length
    const importedCount = result.tables.length
    toast({
      action: 'add',
      item: {
        label: `Imported ${importedCount} table${importedCount !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} error${errorCount !== 1 ? 's' : ''})` : ''}`,
        type: errorCount > 0 ? 'error' : 'success',
      },
    })
  }, [state.importSqlText, state.importSqlDialect, state.importSqlMerge, state.tableCount, setNodes, setEdges, fitView, updateNodeInternals, toast, dispatch])

  const handleImportJsonSchema = useCallback(() => {
    if (!state.importJsonSchemaText.trim()) return

    try {
      const parsed = JSON.parse(state.importJsonSchemaText)
      const result = parseJsonSchema(parsed)
      dispatch({ type: 'SET_IMPORT_JSON_SCHEMA_ERRORS', payload: result.errors.map((e) => e.message) })

      if (result.tables.length === 0) {
        toast({ action: 'add', item: { label: 'No valid definitions found in JSON Schema.', type: 'error' } })
        return
      }

      const { edges: newEdges, nodes: newNodes } = deserializeDiagram({
        relationships: result.relationships,
        tables: result.tables,
      })

      if (state.importJsonSchemaMerge) {
        setNodes((nds) => [...nds, ...(newNodes as Array<TableNode>)])
        setEdges((eds) => [...eds, ...(newEdges as Array<RelationshipEdge>)])
      } else {
        setNodes(newNodes as Array<TableNode>)
        setEdges(newEdges as Array<RelationshipEdge>)
      }

      dispatch({ type: 'SET_TABLE_COUNT', payload: state.tableCount + result.tables.length })
      setTimeout(() => {
        updateNodeInternals(newNodes.map((n) => n.id))
        fitView({ padding: 0.2 })
      }, 100)

      toast({
        action: 'add',
        item: {
          label: `Imported ${result.tables.length} table${result.tables.length !== 1 ? 's' : ''} from JSON Schema`,
          type: 'success',
        },
      })
    } catch {
      dispatch({ type: 'SET_IMPORT_JSON_SCHEMA_ERRORS', payload: ['Invalid JSON. Please check the syntax.'] })
      toast({ action: 'add', item: { label: 'Invalid JSON syntax.', type: 'error' } })
    }
  }, [state.importJsonSchemaText, state.importJsonSchemaMerge, state.tableCount, setNodes, setEdges, fitView, updateNodeInternals, toast, dispatch])

  const handleOpenInMermaidRenderer = useCallback(() => {
    if (!generatedMermaid) return
    localStorage.setItem(MERMAID_PREFILL_KEY, generatedMermaid)
    window.open('/tools/mermaid-renderer', '_blank')
  }, [generatedMermaid])

  // -------------------------------------------------------------------------
  // Panel handlers
  // -------------------------------------------------------------------------
  const togglePanel = useCallback(
    (panel: SidePanel) => {
      if (state.activePanel === panel) {
        dispatch({ type: 'CLOSE_PANEL' })
        return
      }
      if (panel === 'diagram-list') {
        dispatch({ type: 'OPEN_DIAGRAM_LIST_PANEL', payload: { diagramIndex: loadDiagramIndex() } })
      } else if (panel === 'dbml') {
        dispatch({ type: 'OPEN_DBML_PANEL', payload: { generatedDbmlText } })
      } else {
        dispatch({ type: 'SET_ACTIVE_PANEL', payload: panel })
      }
    },
    [state.activePanel, generatedDbmlText, dispatch],
  )

  const handleClosePanel = useCallback(() => dispatch({ type: 'CLOSE_PANEL' }), [dispatch])

  const handleDbmlClose = useCallback(() => {
    dispatch({ type: 'SET_DBML_SOURCE', payload: 'diagram' })
    dispatch({ type: 'CLOSE_PANEL' })
  }, [dispatch])

  const handleSyncFromDiagram = useCallback(() => {
    dispatch({ type: 'SYNC_DBML_FROM_DIAGRAM', payload: { generatedDbmlText } })
  }, [generatedDbmlText, dispatch])

  // -------------------------------------------------------------------------
  // Focus handlers (replacing useEffect-based focus)
  // -------------------------------------------------------------------------
  const handleStartEditingName = useCallback((currentName: string) => {
    dispatch({ type: 'START_EDITING_NAME', payload: { editNameValue: currentName } })
    requestAnimationFrame(() => nameInputRef.current?.focus())
  }, [dispatch, nameInputRef])

  const handleStopEditingName = useCallback(() => {
    dispatch({ type: 'STOP_EDITING_NAME' })
  }, [dispatch])

  const handleStartRenaming = useCallback((id: string, name: string) => {
    dispatch({ type: 'START_RENAMING', payload: { id, name } })
    requestAnimationFrame(() => renameInputRef.current?.focus())
  }, [dispatch, renameInputRef])

  // -------------------------------------------------------------------------
  // Dispatch wrappers for child components
  // -------------------------------------------------------------------------
  const setEditNameValue = useCallback((value: string) => dispatch({ type: 'SET_EDIT_NAME_VALUE', payload: value }), [dispatch])
  const setImportSqlText = useCallback((value: string) => dispatch({ type: 'SET_IMPORT_SQL_TEXT', payload: value }), [dispatch])
  const setImportSqlDialect = useCallback((value: SqlDialect) => dispatch({ type: 'SET_IMPORT_SQL_DIALECT', payload: value }), [dispatch])
  const setImportSqlMerge = useCallback((value: boolean) => dispatch({ type: 'SET_IMPORT_SQL_MERGE', payload: value }), [dispatch])
  const setImportJsonSchemaText = useCallback((value: string) => dispatch({ type: 'SET_IMPORT_JSON_SCHEMA_TEXT', payload: value }), [dispatch])
  const setImportJsonSchemaMerge = useCallback((value: boolean) => dispatch({ type: 'SET_IMPORT_JSON_SCHEMA_MERGE', payload: value }), [dispatch])
  const setSqlDialect = useCallback((value: SqlDialect) => dispatch({ type: 'SET_SQL_DIALECT', payload: value }), [dispatch])
  const setRenameValue = useCallback((value: string) => dispatch({ type: 'SET_RENAME_VALUE', payload: value }), [dispatch])
  const setRenamingId = useCallback((id: string | null) => dispatch({ type: 'SET_RENAMING_ID', payload: id }), [dispatch])

  return {
    fitView,
    generatedDbmlText,
    generatedMermaid,
    generatedSql,
    generatedTypescript,
    handleAddTable,
    handleClosePanel,
    handleDbmlChange,
    handleDbmlClose,
    handleDeleteDiagram,
    handleDiagramNameCommit,
    handleDownloadSql,
    handleExportJson,
    handleImportJson,
    handleImportJsonSchema,
    handleImportSql,
    handleLoadDiagram,
    handleNewDiagram,
    handleOpenInMermaidRenderer,
    handleRearrange,
    handleRenameDiagram,
    handleStartEditingName,
    handleStartRenaming,
    handleStopEditingName,
    handleSyncFromDiagram,
    nodesWithCallbacks,
    onConnect,
    setEditNameValue,
    setImportJsonSchemaMerge,
    setImportJsonSchemaText,
    setImportSqlDialect,
    setImportSqlMerge,
    setImportSqlText,
    setRenameValue,
    setRenamingId,
    setSqlDialect,
    togglePanel,
  }
}
