import type { Connection, EdgeTypes, NodeTypes } from '@xyflow/react'

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  DiagramIndexEntry,
  RelationshipEdgeData,
  RelationshipType,
  SqlDialect,
  TableColumn,
  ToolComponentProps,
} from '@/types'

import { Button, CopyButton, Dialog } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import {
  createDefaultColumn,
  createDefaultTable,
  deleteDiagram,
  deserializeDiagram,
  downloadTextFile,
  formatRelativeTime,
  generateDiagramId,
  generateId,
  generateSql,
  loadDiagram,
  loadDiagramIndex,
  saveDiagram,
  saveDiagramIndex,
  serializeDiagram,
  validateDiagramSchema,
} from '@/utils'

import '@xyflow/react/dist/style.css'
import type { RelationshipEdge } from './RelationshipEdge'
import type { TableNode } from './TableNode'

import { RelationshipEdgeComponent } from './RelationshipEdge'
import { TableNodeComponent } from './TableNode'

const nodeTypes: NodeTypes = { tableNode: TableNodeComponent }
const edgeTypes: EdgeTypes = { relationship: RelationshipEdgeComponent }

const toolEntry = TOOL_REGISTRY_MAP['db-diagram']

const DIALECT_OPTIONS: Array<{ label: string; value: SqlDialect }> = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'SQLite', value: 'sqlite' },
]

const DiagramCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdge>([])
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [tableCount, setTableCount] = useState(0)

  // Diagram management state
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null)
  const [diagramName, setDiagramName] = useState('Untitled Diagram')
  const [diagramIndex, setDiagramIndex] = useState<Array<DiagramIndexEntry>>([])
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Panel state
  const [showSqlPanel, setShowSqlPanel] = useState(false)
  const [showDiagramList, setShowDiagramList] = useState(false)
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('postgresql')

  // Autosave indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const saveStatusTimeoutRef = useRef<number | undefined>(undefined)

  // Rename state for diagram list items
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const { toast } = useToast()

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load diagram index on mount + cleanup save status timeout
  useEffect(() => {
    setDiagramIndex(loadDiagramIndex())
    return () => {
      if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
    }
  }, [])

  // Listen for relationship type change events from edge component
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

  // Autosave logic
  const performSave = useCallback(() => {
    if (nodes.length === 0 && !activeDiagramId) return

    let id = activeDiagramId
    if (!id) {
      // Auto-create a new diagram entry on first modification
      id = generateDiagramId()
      setActiveDiagramId(id)
    }

    const schema = serializeDiagram(nodes, edges)
    try {
      saveDiagram(id, schema)
    } catch {
      toast({ action: 'add', item: { label: 'Failed to save diagram. localStorage may be full.', type: 'error' } })
      return
    }

    // Update index
    const now = new Date().toISOString()
    const idx = loadDiagramIndex()
    const existing = idx.findIndex((e) => e.id === id)
    const entry: DiagramIndexEntry = {
      createdAt: existing >= 0 ? idx[existing].createdAt : now,
      id: id!,
      name: diagramName,
      tableCount: nodes.length,
      updatedAt: now,
    }

    if (existing >= 0) {
      idx[existing] = entry
    } else {
      idx.push(entry)
    }
    saveDiagramIndex(idx)
    setDiagramIndex(idx)

    // Show save indicator
    setSaveStatus('saved')
    if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
    saveStatusTimeoutRef.current = window.setTimeout(() => setSaveStatus('idle'), 2000)
  }, [nodes, edges, activeDiagramId, diagramName, toast])

  const debouncedSave = useDebounceCallback(performSave, 1000)

  // Trigger autosave on nodes/edges change
  useEffect(() => {
    debouncedSave()
  }, [nodes, edges, debouncedSave])

  // SQL generation (reactive, synchronous)
  const generatedSql = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateSql(schema, sqlDialect)
  }, [nodes, edges, sqlDialect])

  const handleAddTable = useCallback(() => {
    const { columns, tableName } = createDefaultTable(tableCount)
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
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
    setTableCount((c) => c + 1)
  }, [screenToFlowPosition, setNodes, tableCount])

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

  const handleClearAll = useCallback(() => {
    setNodes([])
    setEdges([])
    setTableCount(0)
  }, [setNodes, setEdges])

  // Inject callbacks into node data on every render
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

  // Diagram management handlers
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
      setActiveDiagramId(id)
      const entry = diagramIndex.find((e) => e.id === id)
      if (entry) setDiagramName(entry.name)
      setTableCount(newNodes.length)
      setShowDiagramList(false)
      setTimeout(() => fitView({ padding: 0.2 }), 50)
    },
    [diagramIndex, setNodes, setEdges, fitView, toast],
  )

  const handleNewDiagram = useCallback(() => {
    // Find next "Untitled Diagram" increment
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
    setTableCount(0)
    setActiveDiagramId(null)
    setDiagramName(name)
    setShowDiagramList(false)
  }, [setNodes, setEdges])

  const handleDeleteDiagram = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this diagram? This cannot be undone.')) return
      deleteDiagram(id)
      setDiagramIndex(loadDiagramIndex())
      if (activeDiagramId === id) {
        setNodes([])
        setEdges([])
        setTableCount(0)
        setActiveDiagramId(null)
        setDiagramName('Untitled Diagram')
      }
    },
    [activeDiagramId, setNodes, setEdges],
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
        setDiagramIndex([...idx])
        if (activeDiagramId === id) setDiagramName(trimmed)
      }
      setRenamingId(null)
    },
    [activeDiagramId],
  )

  const handleDiagramNameCommit = useCallback(() => {
    const trimmed = editNameValue.trim()
    if (trimmed && trimmed !== diagramName) {
      setDiagramName(trimmed)
      if (activeDiagramId) {
        const idx = loadDiagramIndex()
        const entry = idx.find((e) => e.id === activeDiagramId)
        if (entry) {
          entry.name = trimmed
          saveDiagramIndex(idx)
          setDiagramIndex([...idx])
        }
      }
    }
    setEditingName(false)
  }, [editNameValue, diagramName, activeDiagramId])

  // SQL download
  const handleDownloadSql = useCallback(() => {
    if (!generatedSql) return
    const safeName = diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadTextFile(generatedSql, `${safeName}-${sqlDialect}.sql`, 'application/sql')
  }, [generatedSql, diagramName, sqlDialect])

  // JSON export
  const handleExportJson = useCallback(() => {
    if (nodes.length === 0) return
    const schema = serializeDiagram(nodes, edges)
    const json = JSON.stringify(schema, null, 2)
    const safeName = diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadTextFile(json, `${safeName}.json`, 'application/json')
  }, [nodes, edges, diagramName])

  // JSON import
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
          setTableCount(newNodes.length)
          setActiveDiagramId(null)
          setDiagramName(file.name.replace(/\.json$/i, ''))
          setTimeout(() => fitView({ padding: 0.2 }), 50)
        } catch {
          toast({
            action: 'add',
            item: { label: 'Invalid diagram file. Expected a CSR Dev Tools diagram JSON.', type: 'error' },
          })
        }
      }
      reader.readAsText(file)

      // Reset file input so same file can be re-imported
      e.target.value = ''
    },
    [setNodes, setEdges, fitView, toast],
  )

  const toolbarBtnClass =
    'text-xs rounded bg-gray-800 px-3 py-1.5 font-medium text-gray-300 transition-colors hover:bg-gray-700'

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-3 py-2">
        {/* Diagram name */}
        {editingName ? (
          <input
            autoFocus
            className="text-xs w-40 rounded bg-gray-800 px-2 py-1 font-bold text-white outline-none"
            onBlur={handleDiagramNameCommit}
            onChange={(e) => setEditNameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDiagramNameCommit()
              if (e.key === 'Escape') setEditingName(false)
            }}
            ref={nameInputRef}
            value={editNameValue}
          />
        ) : (
          <button
            className="text-xs hover:text-blue-400 max-w-[200px] truncate font-bold text-white"
            data-testid="diagram-name"
            onClick={() => {
              setEditNameValue(diagramName)
              setEditingName(true)
            }}
            type="button"
          >
            {diagramName}
          </button>
        )}

        {saveStatus === 'saved' && <span className="text-green-500 text-[10px]">Saved</span>}

        <div className="mx-1 h-4 w-px bg-gray-700" />

        <button
          className="bg-blue-600 text-xs hover:bg-blue-500 rounded px-3 py-1.5 font-medium text-white transition-colors"
          data-testid="add-table-btn"
          onClick={handleAddTable}
          type="button"
        >
          + Add Table
        </button>
        <button
          className={toolbarBtnClass}
          data-testid="fit-view-btn"
          onClick={() => fitView({ padding: 0.2 })}
          type="button"
        >
          Fit View
        </button>
        <button className={toolbarBtnClass} data-testid="clear-all-btn" onClick={handleClearAll} type="button">
          Clear All
        </button>

        <div className="mx-1 h-4 w-px bg-gray-700" />

        <button
          className={`${toolbarBtnClass} ${showSqlPanel ? 'bg-blue-700 text-white' : ''}`}
          data-testid="export-sql-btn"
          onClick={() => {
            setShowSqlPanel(!showSqlPanel)
            setShowDiagramList(false)
          }}
          type="button"
        >
          Export SQL
        </button>
        <button className={toolbarBtnClass} data-testid="export-json-btn" onClick={handleExportJson} type="button">
          Export JSON
        </button>
        <button
          className={toolbarBtnClass}
          data-testid="import-json-btn"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Import JSON
        </button>
        <input
          accept=".json"
          className="hidden"
          data-testid="import-json-input"
          onChange={handleImportJson}
          ref={fileInputRef}
          type="file"
        />

        <div className="mx-1 h-4 w-px bg-gray-700" />

        <button
          className={`${toolbarBtnClass} ${showDiagramList ? 'bg-blue-700 text-white' : ''}`}
          data-testid="diagrams-btn"
          onClick={() => {
            setShowDiagramList(!showDiagramList)
            setShowSqlPanel(false)
            setDiagramIndex(loadDiagramIndex())
          }}
          type="button"
        >
          Diagrams
        </button>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            colorMode="dark"
            edgeTypes={edgeTypes}
            edges={edges}
            fitView
            nodeTypes={nodeTypes}
            nodes={nodesWithCallbacks}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onNodesChange={onNodesChange}
            proOptions={{ hideAttribution: true }}
          >
            <Controls />
            <MiniMap />
            <Background gap={16} variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>

        {/* SQL Export Panel */}
        {showSqlPanel && (
          <div className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="sql-panel">
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">SQL Export</span>
              <button
                className="text-xs text-gray-400 hover:text-white"
                onClick={() => setShowSqlPanel(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
              <label className="text-xs text-gray-400" htmlFor="dialect-select">
                Dialect:
              </label>
              <select
                className="text-xs rounded bg-gray-800 px-2 py-1 text-white outline-none"
                data-testid="dialect-select"
                id="dialect-select"
                onChange={(e) => setSqlDialect(e.target.value as SqlDialect)}
                value={sqlDialect}
              >
                {DIALECT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-auto p-3">
              <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="sql-output">
                {generatedSql || '-- Add tables and relationships to generate SQL'}
              </pre>
            </div>

            <div className="flex gap-2 border-t border-gray-800 px-3 py-2">
              <CopyButton label="SQL" value={generatedSql} variant="labeled" />
              <button
                className="text-xs rounded bg-gray-800 px-3 py-1.5 font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
                data-testid="download-sql-btn"
                disabled={!generatedSql}
                onClick={handleDownloadSql}
                type="button"
              >
                Download .sql
              </button>
            </div>
          </div>
        )}

        {/* Diagram List Panel */}
        {showDiagramList && (
          <div
            className="flex w-72 shrink-0 flex-col border-l border-gray-800 bg-gray-950"
            data-testid="diagram-list-panel"
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">Diagrams</span>
              <button
                className="text-xs text-gray-400 hover:text-white"
                onClick={() => setShowDiagramList(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="border-b border-gray-800 px-3 py-2">
              <button
                className="bg-blue-600 text-xs hover:bg-blue-500 w-full rounded px-3 py-1.5 font-medium text-white transition-colors"
                data-testid="new-diagram-btn"
                onClick={handleNewDiagram}
                type="button"
              >
                + New Diagram
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {diagramIndex.length === 0 ? (
                <div className="text-xs px-3 py-4 text-center text-gray-500">No saved diagrams</div>
              ) : (
                diagramIndex.map((entry) => (
                  <div
                    className={`flex items-center gap-2 border-b border-gray-800 px-3 py-2 transition-colors hover:bg-gray-900 ${activeDiagramId === entry.id ? 'bg-gray-800' : ''}`}
                    data-testid={`diagram-item-${entry.id}`}
                    key={entry.id}
                  >
                    <button className="flex-1 text-left" onClick={() => handleLoadDiagram(entry.id)} type="button">
                      {renamingId === entry.id ? (
                        <input
                          autoFocus
                          className="text-xs w-full rounded bg-gray-700 px-1 text-white outline-none"
                          onBlur={() => handleRenameDiagram(entry.id, renameValue)}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameDiagram(entry.id, renameValue)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          value={renameValue}
                        />
                      ) : (
                        <>
                          <div className="text-xs truncate font-medium text-white">{entry.name}</div>
                          <div className="text-[10px] text-gray-500">
                            {formatRelativeTime(entry.updatedAt)} · {entry.tableCount} tables
                          </div>
                        </>
                      )}
                    </button>

                    <button
                      className="hover:text-blue-400 text-[10px] text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        setRenamingId(entry.id)
                        setRenameValue(entry.name)
                      }}
                      title="Rename"
                      type="button"
                    >
                      Rename
                    </button>
                    <button
                      className="hover:text-red-400 text-[10px] text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDiagram(entry.id)
                      }}
                      title="Delete"
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const DbDiagram = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <Button onClick={() => setDialogOpen(true)} variant="primary">
        Open DB Diagram
      </Button>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={onAfterDialogClose}
        size="screen"
        title="DB Diagram"
      >
        <ReactFlowProvider>
          <DiagramCanvas />
        </ReactFlowProvider>
      </Dialog>
    </div>
  )
}
