import type { Connection, EdgeTypes, NodeTypes } from '@xyflow/react'

import { json } from '@codemirror/lang-json'
import { sql as sqlLang } from '@codemirror/lang-sql'
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
import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes } from 'react'

import type {
  DiagramIndexEntry,
  RelationshipEdgeData,
  RelationshipType,
  SqlDialect,
  TableColumn,
  ToolComponentProps,
} from '@/types'

import {
  Button,
  CheckboxInput,
  ChevronIcon,
  CodeInput,
  CopyButton,
  Dialog,
  DropdownMenu,
  ListIcon,
  SelectInput,
  TextInput,
} from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import {
  createDefaultColumn,
  createDefaultTable,
  deleteDiagram,
  deserializeDiagram,
  downloadTextFile,
  formatRelativeTime,
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
  tv,
  validateDiagramSchema,
} from '@/utils'

import '@xyflow/react/dist/style.css'
import type { RelationshipEdge } from './RelationshipEdge'
import type { TableNode } from './TableNode'

import { RelationshipEdgeComponent } from './RelationshipEdge'
import { TableNodeComponent } from './TableNode'

const nodeTypes: NodeTypes = { tableNode: TableNodeComponent }
const edgeTypes: EdgeTypes = { relationship: RelationshipEdgeComponent }

const diagramItemStyles = tv({
  base: 'flex items-center gap-2 border-b border-gray-800 px-3 py-2 transition-colors hover:bg-gray-900',
  variants: {
    active: {
      true: 'bg-gray-800',
      false: '',
    },
  },
})

const toolEntry = TOOL_REGISTRY_MAP['db-diagram']

const DIALECT_OPTIONS: Array<{ label: string; value: SqlDialect }> = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'SQLite', value: 'sqlite' },
]

type SidePanel =
  | 'dbml'
  | 'diagram-list'
  | 'export-mermaid'
  | 'export-sql'
  | 'export-typescript'
  | 'import-json-schema'
  | 'import-sql'
  | null

const MERMAID_PREFILL_KEY = 'csr-dev-tools-mermaid-renderer-prefill'

const CloseButton = ({ onClick }: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) => {
  return (
    <button className="text-xs text-gray-400 hover:text-white" onClick={onClick} type="button">
      Close
    </button>
  )
}

const DiagramCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdge>([])
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [tableCount, setTableCount] = useState(0)
  const sqlExtensions = useMemo(() => [sqlLang()], [])
  const jsonExtensions = useMemo(() => [json()], [])

  // Diagram management state
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null)
  const [diagramName, setDiagramName] = useState('Untitled Diagram')
  const [diagramIndex, setDiagramIndex] = useState<Array<DiagramIndexEntry>>([])
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Panel state (only one side panel at a time)
  const [activePanel, setActivePanel] = useState<SidePanel>(null)
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('postgresql')

  // Import state
  const [importSqlText, setImportSqlText] = useState('')
  const [importSqlDialect, setImportSqlDialect] = useState<SqlDialect>('postgresql')
  const [importSqlMerge, setImportSqlMerge] = useState(false)
  const [importSqlErrors, setImportSqlErrors] = useState<Array<{ line: number; message: string }>>([])
  const [importJsonSchemaText, setImportJsonSchemaText] = useState('')
  const [importJsonSchemaMerge, setImportJsonSchemaMerge] = useState(false)
  const [importJsonSchemaErrors, setImportJsonSchemaErrors] = useState<Array<string>>([])

  // DBML state
  const [dbmlText, setDbmlText] = useState('')
  const [dbmlErrors, setDbmlErrors] = useState<Array<{ line: number; message: string }>>([])
  const [dbmlSource, setDbmlSource] = useState<'diagram' | 'editor'>('diagram')

  // Rename state for diagram list items
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const { toast } = useToast()

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load diagram index on mount + restore last updated diagram
  useEffect(() => {
    const idx = loadDiagramIndex()
    setDiagramIndex(idx)

    if (idx.length > 0) {
      const latest = [...idx].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      const schema = loadDiagram(latest.id)
      if (schema) {
        const { edges: restoredEdges, nodes: restoredNodes } = deserializeDiagram(schema)
        setNodes(restoredNodes as Array<TableNode>)
        setEdges(restoredEdges as Array<RelationshipEdge>)
        setActiveDiagramId(latest.id)
        setDiagramName(latest.name)
        setTableCount(restoredNodes.length)
        setTimeout(() => fitView({ padding: 0.2 }), 50)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

    toast({ action: 'add', item: { label: 'Diagram saved', type: 'success' } })
  }, [nodes, edges, activeDiagramId, diagramName, toast])

  const debouncedSave = useDebounceCallback(performSave, 3000)

  useEffect(() => {
    debouncedSave()
  }, [nodes, edges, debouncedSave])

  // SQL generation (reactive, synchronous)
  const generatedSql = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateSql(schema, sqlDialect)
  }, [nodes, edges, sqlDialect])

  // Mermaid generation (reactive, synchronous)
  const generatedMermaid = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateMermaidER(schema)
  }, [nodes, edges])

  // TypeScript generation (reactive, synchronous)
  const generatedTypescript = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateTypeScript(schema)
  }, [nodes, edges])

  // DBML generation (reactive, synchronous)
  const generatedDbmlText = useMemo(() => {
    if (nodes.length === 0) return ''
    const schema = serializeDiagram(nodes, edges)
    return generateDbml(schema)
  }, [nodes, edges])

  // Sync diagram → DBML editor when source is diagram
  useEffect(() => {
    if (dbmlSource === 'diagram' && activePanel === 'dbml') {
      setDbmlText(generatedDbmlText)
      setDbmlErrors([])
    }
  }, [generatedDbmlText, dbmlSource, activePanel])

  // Parse DBML editor → diagram (debounced)
  const applyDbml = useCallback(
    (text: string) => {
      if (!text.trim()) return

      const result = parseDbml(text)
      setDbmlErrors(result.errors)

      if (result.tables.length === 0) return

      const { edges: newEdges, nodes: newNodes } = deserializeDiagram({
        relationships: result.relationships,
        tables: result.tables,
      })

      setNodes(newNodes as Array<TableNode>)
      setEdges(newEdges as Array<RelationshipEdge>)
      setTableCount(result.tables.length)
    },
    [setNodes, setEdges],
  )

  const debouncedApplyDbml = useDebounceCallback(applyDbml, 500)

  const handleDbmlChange = useCallback(
    (text: string) => {
      setDbmlSource('editor')
      setDbmlText(text)
      debouncedApplyDbml(text)
    },
    [debouncedApplyDbml],
  )

  const handleAddTable = useCallback(() => {
    const { columns, tableName } = createDefaultTable(tableCount)
    const offset = tableCount * 30
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
      setActivePanel(null)
      setTimeout(() => fitView({ padding: 0.2 }), 50)
    },
    [diagramIndex, setNodes, setEdges, fitView, toast],
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
    setTableCount(0)
    setActiveDiagramId(null)
    setDiagramName(name)
    setActivePanel(null)
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

  // JSON file import
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
      e.target.value = ''
    },
    [setNodes, setEdges, fitView, toast],
  )

  // Import SQL DDL
  const handleImportSql = useCallback(() => {
    if (!importSqlText.trim()) return

    const result = parseSqlDdl(importSqlText, importSqlDialect)
    setImportSqlErrors(result.errors)

    if (result.tables.length === 0) {
      toast({ action: 'add', item: { label: 'No valid CREATE TABLE statements found.', type: 'error' } })
      return
    }

    const { edges: newEdges, nodes: newNodes } = deserializeDiagram({
      relationships: result.relationships,
      tables: result.tables,
    })

    if (importSqlMerge) {
      setNodes((nds) => [...nds, ...(newNodes as Array<TableNode>)])
      setEdges((eds) => [...eds, ...(newEdges as Array<RelationshipEdge>)])
    } else {
      setNodes(newNodes as Array<TableNode>)
      setEdges(newEdges as Array<RelationshipEdge>)
    }

    setTableCount((c) => c + result.tables.length)
    setTimeout(() => fitView({ padding: 0.2 }), 50)

    const errorCount = result.errors.length
    const importedCount = result.tables.length
    toast({
      action: 'add',
      item: {
        label: `Imported ${importedCount} table${importedCount !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} error${errorCount !== 1 ? 's' : ''})` : ''}`,
        type: errorCount > 0 ? 'error' : 'success',
      },
    })
  }, [importSqlText, importSqlDialect, importSqlMerge, setNodes, setEdges, fitView, toast])

  // Import JSON Schema
  const handleImportJsonSchema = useCallback(() => {
    if (!importJsonSchemaText.trim()) return

    try {
      const parsed = JSON.parse(importJsonSchemaText)
      const result = parseJsonSchema(parsed)
      setImportJsonSchemaErrors(result.errors.map((e) => e.message))

      if (result.tables.length === 0) {
        toast({ action: 'add', item: { label: 'No valid definitions found in JSON Schema.', type: 'error' } })
        return
      }

      const { edges: newEdges, nodes: newNodes } = deserializeDiagram({
        relationships: result.relationships,
        tables: result.tables,
      })

      if (importJsonSchemaMerge) {
        setNodes((nds) => [...nds, ...(newNodes as Array<TableNode>)])
        setEdges((eds) => [...eds, ...(newEdges as Array<RelationshipEdge>)])
      } else {
        setNodes(newNodes as Array<TableNode>)
        setEdges(newEdges as Array<RelationshipEdge>)
      }

      setTableCount((c) => c + result.tables.length)
      setTimeout(() => fitView({ padding: 0.2 }), 50)

      toast({
        action: 'add',
        item: {
          label: `Imported ${result.tables.length} table${result.tables.length !== 1 ? 's' : ''} from JSON Schema`,
          type: 'success',
        },
      })
    } catch {
      setImportJsonSchemaErrors(['Invalid JSON. Please check the syntax.'])
      toast({ action: 'add', item: { label: 'Invalid JSON syntax.', type: 'error' } })
    }
  }, [importJsonSchemaText, importJsonSchemaMerge, setNodes, setEdges, fitView, toast])

  // Open in Mermaid Renderer
  const handleOpenInMermaidRenderer = useCallback(() => {
    if (!generatedMermaid) return
    localStorage.setItem(MERMAID_PREFILL_KEY, generatedMermaid)
    window.open('/tools/mermaid-renderer', '_blank')
  }, [generatedMermaid])

  // Panel toggle helper
  const togglePanel = useCallback(
    (panel: SidePanel) => {
      setActivePanel((prev) => {
        if (prev === panel) return null
        if (panel === 'diagram-list') setDiagramIndex(loadDiagramIndex())
        if (panel === 'dbml') {
          setDbmlSource('diagram')
          setDbmlText(generatedDbmlText)
          setDbmlErrors([])
        }
        return panel
      })
    },
    [generatedDbmlText],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-950 px-3 py-2">
        <Button
          data-testid="diagrams-btn"
          icon={<ListIcon size={16} />}
          onClick={() => togglePanel('diagram-list')}
          size="small"
          variant={activePanel === 'diagram-list' ? 'primary' : 'default'}
        />

        {/* Diagram name */}
        {editingName ? (
          <TextInput
            autoFocus
            block={false}
            name="diagram-name"
            onBlur={handleDiagramNameCommit}
            onChange={(value) => setEditNameValue(value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDiagramNameCommit()
              if (e.key === 'Escape') setEditingName(false)
            }}
            ref={nameInputRef}
            size="compact"
            type="text"
            value={editNameValue}
          />
        ) : (
          <button
            className="text-xs max-w-[200px] truncate font-bold text-white hover:text-primary"
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

        <div className="mx-1 h-4 w-px bg-gray-700" />

        <Button data-testid="add-table-btn" onClick={handleAddTable} size="small" variant="primary">
          + Add Table
        </Button>
        <Button data-testid="rearrange-btn" onClick={handleRearrange} size="small" variant="default">
          Rearrange
        </Button>
        <Button data-testid="fit-view-btn" onClick={() => fitView({ padding: 0.2 })} size="small" variant="default">
          Fit View
        </Button>

        <div className="mx-1 h-4 w-px bg-gray-700" />

        {/* Import dropdown */}
        <DropdownMenu
          items={[
            {
              active: activePanel === 'import-sql',
              'data-testid': 'import-sql-btn',
              label: 'Import SQL',
              onSelect: () => togglePanel('import-sql'),
            },
            {
              active: activePanel === 'import-json-schema',
              'data-testid': 'import-json-schema-btn',
              label: 'Import Schema',
              onSelect: () => togglePanel('import-json-schema'),
            },
            {
              'data-testid': 'import-json-btn',
              label: 'Import JSON',
              onSelect: () => fileInputRef.current?.click(),
            },
          ]}
          trigger={
            <Button data-testid="import-dropdown-btn" size="small" variant="default">
              <span className="inline-flex items-center gap-1">
                Import <ChevronIcon size={12} />
              </span>
            </Button>
          }
        />
        <input
          accept=".json"
          className="hidden"
          data-testid="import-json-input"
          onChange={handleImportJson}
          ref={fileInputRef}
          type="file"
        />

        {/* Export dropdown */}
        <DropdownMenu
          items={[
            {
              active: activePanel === 'export-sql',
              'data-testid': 'export-sql-btn',
              label: 'Export SQL',
              onSelect: () => togglePanel('export-sql'),
            },
            {
              active: activePanel === 'export-mermaid',
              'data-testid': 'export-mermaid-btn',
              label: 'Export Mermaid',
              onSelect: () => togglePanel('export-mermaid'),
            },
            {
              active: activePanel === 'export-typescript',
              'data-testid': 'export-typescript-btn',
              label: 'Export TS',
              onSelect: () => togglePanel('export-typescript'),
            },
            {
              'data-testid': 'export-json-btn',
              label: 'Export JSON',
              onSelect: handleExportJson,
            },
          ]}
          trigger={
            <Button data-testid="export-dropdown-btn" size="small" variant="default">
              <span className="inline-flex items-center gap-1">
                Export <ChevronIcon size={12} />
              </span>
            </Button>
          }
        />

        <Button
          data-testid="dbml-btn"
          onClick={() => togglePanel('dbml')}
          size="small"
          variant={activePanel === 'dbml' ? 'primary' : 'default'}
        >
          DBML
        </Button>
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

        {/* Import SQL Panel */}
        {activePanel === 'import-sql' && (
          <div
            className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950"
            data-testid="import-sql-panel"
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">Import SQL</span>
              <CloseButton onClick={() => setActivePanel(null)} />
            </div>

            <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
              <span className="text-xs text-gray-400">Dialect:</span>
              <SelectInput
                block={false}
                name="import-dialect-select"
                onChange={(value) => setImportSqlDialect(value as SqlDialect)}
                options={DIALECT_OPTIONS}
                size="compact"
                value={importSqlDialect}
              />
            </div>

            <div className="flex-1 overflow-auto p-3">
              <CodeInput
                extensions={sqlExtensions}
                height="192px"
                name="import-sql-input"
                onChange={setImportSqlText}
                placeholder="Paste CREATE TABLE statements..."
                size="compact"
                value={importSqlText}
              />

              {importSqlErrors.length > 0 && (
                <div className="mt-2 space-y-1" data-testid="import-sql-errors">
                  {importSqlErrors.map((err, i) => (
                    <p className="text-[10px] text-error" key={i}>
                      {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-800 px-3 py-2">
              <label className="flex items-center gap-2 text-[10px] text-gray-400">
                <CheckboxInput
                  checked={importSqlMerge}
                  className="rounded"
                  name="import-sql-merge"
                  onChange={setImportSqlMerge}
                />
                Merge with existing (otherwise replaces)
              </label>
              <button
                className="text-xs w-full rounded bg-primary px-3 py-1.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                data-testid="import-sql-submit"
                disabled={!importSqlText.trim()}
                onClick={handleImportSql}
                type="button"
              >
                Import
              </button>
            </div>
          </div>
        )}

        {/* Import JSON Schema Panel */}
        {activePanel === 'import-json-schema' && (
          <div
            className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950"
            data-testid="import-json-schema-panel"
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">Import JSON Schema</span>
              <CloseButton onClick={() => setActivePanel(null)} />
            </div>

            <div className="flex-1 overflow-auto p-3">
              <CodeInput
                extensions={jsonExtensions}
                height="192px"
                name="import-json-schema-input"
                onChange={setImportJsonSchemaText}
                placeholder="Paste JSON Schema..."
                size="compact"
                value={importJsonSchemaText}
              />

              {importJsonSchemaErrors.length > 0 && (
                <div className="mt-2 space-y-1" data-testid="import-json-schema-errors">
                  {importJsonSchemaErrors.map((err, i) => (
                    <p className="text-[10px] text-error" key={i}>
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-800 px-3 py-2">
              <label className="flex items-center gap-2 text-[10px] text-gray-400">
                <CheckboxInput
                  checked={importJsonSchemaMerge}
                  className="rounded"
                  name="import-json-schema-merge"
                  onChange={setImportJsonSchemaMerge}
                />
                Merge with existing (otherwise replaces)
              </label>
              <Button
                block
                data-testid="import-json-schema-submit"
                disabled={!importJsonSchemaText.trim()}
                onClick={handleImportJsonSchema}
                size="small"
                variant="primary"
              >
                Import
              </Button>
            </div>
          </div>
        )}

        {/* SQL Export Panel */}
        {activePanel === 'export-sql' && (
          <div className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="sql-panel">
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">SQL Export</span>
              <CloseButton onClick={() => setActivePanel(null)} />
            </div>

            <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
              <span className="text-xs text-gray-400">Dialect:</span>
              <SelectInput
                block={false}
                name="dialect-select"
                onChange={(value) => setSqlDialect(value as SqlDialect)}
                options={DIALECT_OPTIONS}
                size="compact"
                value={sqlDialect}
              />
            </div>

            <div className="flex-1 overflow-auto p-3">
              <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="sql-output">
                {generatedSql || '-- Add tables and relationships to generate SQL'}
              </pre>
            </div>

            <div className="flex gap-2 border-t border-gray-800 px-3 py-2">
              <CopyButton label="SQL" value={generatedSql} />
              <div className="grow">
                <Button
                  block
                  data-testid="download-sql-btn"
                  disabled={!generatedSql}
                  onClick={handleDownloadSql}
                  size="small"
                  variant="primary"
                >
                  Download .sql
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mermaid Export Panel */}
        {activePanel === 'export-mermaid' && (
          <div className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="mermaid-panel">
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">Mermaid Export</span>
              <CloseButton onClick={() => setActivePanel(null)} />
            </div>

            <div className="flex-1 overflow-auto p-3">
              <pre
                className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300"
                data-testid="mermaid-output"
              >
                {generatedMermaid || '%% Add tables and relationships to generate Mermaid ER syntax'}
              </pre>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-gray-800 px-3 py-2">
              <CopyButton label="Mermaid" value={generatedMermaid} />
              <div className="grow">
                <Button
                  block
                  data-testid="open-mermaid-renderer-btn"
                  disabled={!generatedMermaid}
                  onClick={handleOpenInMermaidRenderer}
                  size="small"
                  variant="primary"
                >
                  Open in Mermaid Renderer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TypeScript Export Panel */}
        {activePanel === 'export-typescript' && (
          <div
            className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950"
            data-testid="typescript-panel"
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">TypeScript Export</span>
              <CloseButton onClick={() => setActivePanel(null)} />
            </div>

            <div className="flex-1 overflow-auto p-3">
              <pre
                className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300"
                data-testid="typescript-output"
              >
                {generatedTypescript || '// Add tables to generate TypeScript types'}
              </pre>
            </div>

            <div className="flex gap-2 border-t border-gray-800 px-3 py-2">
              <CopyButton label="TypeScript" value={generatedTypescript} />
            </div>
          </div>
        )}

        {/* DBML Editor Panel */}
        {activePanel === 'dbml' && (
          <div className="flex w-96 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="dbml-panel">
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">DBML Editor</span>
              <CloseButton
                onClick={() => {
                  setDbmlSource('diagram')
                  setActivePanel(null)
                }}
              />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden p-3">
              <CodeInput
                height="100%"
                name="dbml-editor"
                onChange={handleDbmlChange}
                placeholder={
                  '// Define your schema in DBML\n\nTable users {\n  id serial [pk]\n  name varchar [not null]\n}'
                }
                size="compact"
                value={dbmlText}
              />

              {dbmlErrors.length > 0 && (
                <div className="mt-2 max-h-24 space-y-1 overflow-auto" data-testid="dbml-errors">
                  {dbmlErrors.map((err, i) => (
                    <p className="text-[10px] text-error" key={i}>
                      Line {err.line}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-gray-800 px-3 py-2">
              <CopyButton label="DBML" value={dbmlText} />
              <div className="grow">
                <Button
                  block
                  data-testid="dbml-sync-btn"
                  onClick={() => {
                    setDbmlSource('diagram')
                    setDbmlText(generatedDbmlText)
                    setDbmlErrors([])
                  }}
                  size="small"
                  variant="primary"
                >
                  Sync from Diagram
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Diagram List Panel */}
        {activePanel === 'diagram-list' && (
          <div
            className="flex w-72 shrink-0 flex-col border-l border-gray-800 bg-gray-950"
            data-testid="diagram-list-panel"
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
              <span className="text-xs font-bold text-white">Diagrams</span>
              <CloseButton onClick={() => setActivePanel(null)} />
            </div>

            <div className="border-b border-gray-800 px-3 py-2">
              <Button block data-testid="new-diagram-btn" onClick={handleNewDiagram} size="small" variant="primary">
                + New Diagram
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              {diagramIndex.length === 0 ? (
                <div className="text-xs px-3 py-4 text-center text-gray-500">No saved diagrams</div>
              ) : (
                [...diagramIndex]
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .map((entry) => (
                    <div
                      className={diagramItemStyles({ active: activeDiagramId === entry.id })}
                      data-testid={`diagram-item-${entry.id}`}
                      key={entry.id}
                    >
                      <button
                        className="flex-1 cursor-pointer text-left"
                        onClick={() => handleLoadDiagram(entry.id)}
                        type="button"
                      >
                        {renamingId === entry.id ? (
                          <TextInput
                            autoFocus
                            block={false}
                            onBlur={() => handleRenameDiagram(entry.id, renameValue)}
                            onChange={(value) => setRenameValue(value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameDiagram(entry.id, renameValue)
                              if (e.key === 'Escape') setRenamingId(null)
                            }}
                            name="diagram-name"
                            size="compact"
                            type="text"
                            value={renameValue}
                          />
                        ) : (
                          <>
                            <div className="text-xs w-40 truncate font-medium text-white">{entry.name}</div>
                            <div className="text-[10px] text-gray-500">
                              {formatRelativeTime(entry.updatedAt)} · {entry.tableCount} tables
                            </div>
                          </>
                        )}
                      </button>

                      <button
                        className="text-[10px] text-gray-500 hover:text-primary"
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
                        className="text-[10px] text-gray-500 hover:text-error"
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

      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => setDialogOpen(true)} variant="primary">
          Open DB Diagram
        </Button>
      </div>

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
