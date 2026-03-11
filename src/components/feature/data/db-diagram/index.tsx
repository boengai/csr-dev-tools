import { json } from '@codemirror/lang-json'
import { sql as sqlLang } from '@codemirror/lang-sql'
import type { Connection, EdgeTypes, NodeTypes, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useMemo, useReducer, useRef, useState } from 'react'

import { Button, Dialog } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { DiagramIndexEntry, SqlDialect, ToolComponentProps } from '@/types'

import '@xyflow/react/dist/style.css'
import { DbmlEditorPanel } from './DbmlEditorPanel'
import { DiagramListPanel } from './DiagramListPanel'
import { diagramReducer, initialDiagramState } from './diagramReducer'
import { DiagramToolbar } from './DiagramToolbar'
import { ExportMermaidPanel } from './ExportMermaidPanel'
import { ExportSqlPanel } from './ExportSqlPanel'
import { ExportTypescriptPanel } from './ExportTypescriptPanel'
import { ImportJsonSchemaPanel } from './ImportJsonSchemaPanel'
import { ImportSqlPanel } from './ImportSqlPanel'
import type { RelationshipEdge } from './RelationshipEdge'
import { RelationshipEdgeComponent } from './RelationshipEdge'
import type { TableNode } from './TableNode'
import { TableNodeComponent } from './TableNode'
import type { SidePanel } from './types'
import { useDiagramHandlers } from './useDiagramHandlers'

const nodeTypes: NodeTypes = { tableNode: TableNodeComponent }
const edgeTypes: EdgeTypes = { relationship: RelationshipEdgeComponent }

const toolEntry = TOOL_REGISTRY_MAP['db-diagram']

// ---------------------------------------------------------------------------
// DiagramFlowCanvas - extracted ReactFlow rendering
// ---------------------------------------------------------------------------

type DiagramFlowCanvasProps = {
  edgeTypes: EdgeTypes
  edges: Array<RelationshipEdge>
  nodeTypes: NodeTypes
  nodesWithCallbacks: Array<TableNode>
  onConnect: (connection: Connection) => void
  onEdgesChange: OnEdgesChange<RelationshipEdge>
  onNodesChange: OnNodesChange<TableNode>
}

const DiagramFlowCanvas = ({
  edgeTypes: edgeTypesProp,
  edges,
  nodeTypes: nodeTypesProp,
  nodesWithCallbacks,
  onConnect,
  onEdgesChange,
  onNodesChange,
}: DiagramFlowCanvasProps) => (
  <div className="flex-1">
    <ReactFlow
      colorMode="dark"
      edgeTypes={edgeTypesProp}
      edges={edges}
      fitView
      nodeTypes={nodeTypesProp}
      nodes={nodesWithCallbacks}
      onConnect={onConnect}
      onEdgesChange={onEdgesChange}
      onNodesChange={onNodesChange}
      proOptions={{ hideAttribution: true }}
    >
      <Controls />
      <MiniMap
        bgColor="oklch(0.12 0.008 270)"
        maskColor="rgba(0, 0, 0, 0.6)"
        maskStrokeColor="oklch(0.55 0.22 310)"
        maskStrokeWidth={2}
        nodeColor={(node) => {
          const palette = [
            'oklch(0.55 0.22 310)',
            'oklch(0.65 0.12 260)',
            'oklch(0.6 0.15 240)',
            'oklch(0.65 0.18 165)',
            'oklch(0.75 0.15 85)',
            'oklch(0.6 0.2 15)',
            'oklch(0.7 0.15 30)',
            'oklch(0.6 0.18 200)',
          ]
          const idx = nodesWithCallbacks.findIndex((n) => n.id === node.id)
          return palette[idx % palette.length]
        }}
        nodeStrokeColor="oklch(0.25 0.008 270)"
        nodeStrokeWidth={2}
        pannable
        style={{ borderRadius: 8, border: '1px solid oklch(0.25 0.008 270)' }}
        zoomable
      />
      <Background gap={16} variant={BackgroundVariant.Dots} />
    </ReactFlow>
  </div>
)

// ---------------------------------------------------------------------------
// SidePanelRenderer - extracted conditional side panel rendering
// ---------------------------------------------------------------------------

type SidePanelRendererProps = {
  activePanel: SidePanel
  activeDiagramId: string | null
  dbmlErrors: Array<{ line: number; message: string }>
  dbmlText: string
  diagramIndex: Array<DiagramIndexEntry>
  generatedMermaid: string
  generatedSql: string
  generatedTypescript: string
  handleClosePanel: () => void
  handleDbmlChange: (text: string) => void
  handleDbmlClose: () => void
  handleDeleteDiagram: (id: string) => void
  handleDownloadSql: () => void
  handleImportJsonSchema: () => void
  handleImportSql: () => void
  handleLoadDiagram: (id: string) => void
  handleNewDiagram: () => void
  handleOpenInMermaidRenderer: () => void
  handleRenameDiagram: (id: string, newName: string) => void
  handleStartRenaming: (id: string, name: string) => void
  handleSyncFromDiagram: () => void
  importJsonSchemaErrors: Array<string>
  importJsonSchemaMerge: boolean
  importJsonSchemaText: string
  importSqlDialect: SqlDialect
  importSqlErrors: Array<{ line: number; message: string }>
  importSqlMerge: boolean
  importSqlText: string
  jsonExtensions: Array<import('@codemirror/state').Extension>
  renameInputRef: React.RefObject<HTMLInputElement | null>
  renameValue: string
  renamingId: string | null
  setImportJsonSchemaMerge: (value: boolean) => void
  setImportJsonSchemaText: (value: string) => void
  setImportSqlDialect: (value: SqlDialect) => void
  setImportSqlMerge: (value: boolean) => void
  setImportSqlText: (value: string) => void
  setRenameValue: (value: string) => void
  setRenamingId: (id: string | null) => void
  setSqlDialect: (value: SqlDialect) => void
  sqlDialect: SqlDialect
  sqlExtensions: Array<import('@codemirror/state').Extension>
}

const SidePanelRenderer = ({
  activePanel,
  activeDiagramId,
  dbmlErrors,
  dbmlText,
  diagramIndex,
  generatedMermaid,
  generatedSql,
  generatedTypescript,
  handleClosePanel,
  handleDbmlChange,
  handleDbmlClose,
  handleDeleteDiagram,
  handleDownloadSql,
  handleImportJsonSchema,
  handleImportSql,
  handleLoadDiagram,
  handleNewDiagram,
  handleOpenInMermaidRenderer,
  handleRenameDiagram,
  handleStartRenaming,
  handleSyncFromDiagram,
  importJsonSchemaErrors,
  importJsonSchemaMerge,
  importJsonSchemaText,
  importSqlDialect,
  importSqlErrors,
  importSqlMerge,
  importSqlText,
  jsonExtensions,
  renameInputRef,
  renameValue,
  renamingId,
  setImportJsonSchemaMerge,
  setImportJsonSchemaText,
  setImportSqlDialect,
  setImportSqlMerge,
  setImportSqlText,
  setRenameValue,
  setRenamingId,
  setSqlDialect,
  sqlDialect,
  sqlExtensions,
}: SidePanelRendererProps) => {
  switch (activePanel) {
    case 'import-sql':
      return (
        <ImportSqlPanel
          importSqlDialect={importSqlDialect}
          importSqlErrors={importSqlErrors}
          importSqlMerge={importSqlMerge}
          importSqlText={importSqlText}
          onClose={handleClosePanel}
          onImport={handleImportSql}
          setImportSqlDialect={setImportSqlDialect}
          setImportSqlMerge={setImportSqlMerge}
          setImportSqlText={setImportSqlText}
          sqlExtensions={sqlExtensions}
        />
      )
    case 'import-json-schema':
      return (
        <ImportJsonSchemaPanel
          importJsonSchemaErrors={importJsonSchemaErrors}
          importJsonSchemaMerge={importJsonSchemaMerge}
          importJsonSchemaText={importJsonSchemaText}
          jsonExtensions={jsonExtensions}
          onClose={handleClosePanel}
          onImport={handleImportJsonSchema}
          setImportJsonSchemaMerge={setImportJsonSchemaMerge}
          setImportJsonSchemaText={setImportJsonSchemaText}
        />
      )
    case 'export-sql':
      return (
        <ExportSqlPanel
          generatedSql={generatedSql}
          onClose={handleClosePanel}
          onDownload={handleDownloadSql}
          setSqlDialect={setSqlDialect}
          sqlDialect={sqlDialect}
        />
      )
    case 'export-mermaid':
      return (
        <ExportMermaidPanel
          generatedMermaid={generatedMermaid}
          onClose={handleClosePanel}
          onOpenInRenderer={handleOpenInMermaidRenderer}
        />
      )
    case 'export-typescript':
      return <ExportTypescriptPanel generatedTypescript={generatedTypescript} onClose={handleClosePanel} />
    case 'dbml':
      return (
        <DbmlEditorPanel
          dbmlErrors={dbmlErrors}
          dbmlText={dbmlText}
          onClose={handleDbmlClose}
          onDbmlChange={handleDbmlChange}
          onSyncFromDiagram={handleSyncFromDiagram}
        />
      )
    case 'diagram-list':
      return (
        <DiagramListPanel
          activeDiagramId={activeDiagramId}
          diagramIndex={diagramIndex}
          onClose={handleClosePanel}
          onDeleteDiagram={handleDeleteDiagram}
          onLoadDiagram={handleLoadDiagram}
          onNewDiagram={handleNewDiagram}
          onRenameDiagram={handleRenameDiagram}
          onStartRenaming={handleStartRenaming}
          renameInputRef={renameInputRef}
          renameValue={renameValue}
          renamingId={renamingId}
          setRenameValue={setRenameValue}
          setRenamingId={setRenamingId}
        />
      )
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// DiagramCanvas (main component)
// ---------------------------------------------------------------------------

const DiagramCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdge>([])
  const sqlExtensions = useMemo(() => [sqlLang()], [])
  const jsonExtensions = useMemo(() => [json()], [])

  const [state, dispatch] = useReducer(diagramReducer, initialDiagramState)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    fitView,
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
  } = useDiagramHandlers({
    dispatch,
    edges,
    nameInputRef,
    nodes,
    renameInputRef,
    setEdges,
    setNodes,
    state,
  })

  return (
    <div className="flex h-full flex-col">
      <DiagramToolbar
        activePanel={state.activePanel}
        diagramName={state.diagramName}
        editNameValue={state.editNameValue}
        editingName={state.editingName}
        fileInputRef={fileInputRef}
        fitView={fitView}
        handleAddTable={handleAddTable}
        handleDiagramNameCommit={handleDiagramNameCommit}
        handleExportJson={handleExportJson}
        handleImportJson={handleImportJson}
        handleRearrange={handleRearrange}
        nameInputRef={nameInputRef}
        setEditNameValue={setEditNameValue}
        setEditingName={handleStartEditingName}
        stopEditingName={handleStopEditingName}
        togglePanel={togglePanel}
      />

      <div className="flex flex-1 overflow-hidden">
        <DiagramFlowCanvas
          edgeTypes={edgeTypes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesWithCallbacks={nodesWithCallbacks}
          onConnect={onConnect}
          onEdgesChange={onEdgesChange}
          onNodesChange={onNodesChange}
        />

        <SidePanelRenderer
          activePanel={state.activePanel}
          activeDiagramId={state.activeDiagramId}
          dbmlErrors={state.dbmlErrors}
          dbmlText={state.dbmlText}
          diagramIndex={state.diagramIndex}
          generatedMermaid={generatedMermaid}
          generatedSql={generatedSql}
          generatedTypescript={generatedTypescript}
          handleClosePanel={handleClosePanel}
          handleDbmlChange={handleDbmlChange}
          handleDbmlClose={handleDbmlClose}
          handleDeleteDiagram={handleDeleteDiagram}
          handleDownloadSql={handleDownloadSql}
          handleImportJsonSchema={handleImportJsonSchema}
          handleImportSql={handleImportSql}
          handleLoadDiagram={handleLoadDiagram}
          handleNewDiagram={handleNewDiagram}
          handleOpenInMermaidRenderer={handleOpenInMermaidRenderer}
          handleRenameDiagram={handleRenameDiagram}
          handleStartRenaming={handleStartRenaming}
          handleSyncFromDiagram={handleSyncFromDiagram}
          importJsonSchemaErrors={state.importJsonSchemaErrors}
          importJsonSchemaMerge={state.importJsonSchemaMerge}
          importJsonSchemaText={state.importJsonSchemaText}
          importSqlDialect={state.importSqlDialect}
          importSqlErrors={state.importSqlErrors}
          importSqlMerge={state.importSqlMerge}
          importSqlText={state.importSqlText}
          jsonExtensions={jsonExtensions}
          renameInputRef={renameInputRef}
          renameValue={state.renameValue}
          renamingId={state.renamingId}
          setImportJsonSchemaMerge={setImportJsonSchemaMerge}
          setImportJsonSchemaText={setImportJsonSchemaText}
          setImportSqlDialect={setImportSqlDialect}
          setImportSqlMerge={setImportSqlMerge}
          setImportSqlText={setImportSqlText}
          setRenameValue={setRenameValue}
          setRenamingId={setRenamingId}
          setSqlDialect={setSqlDialect}
          sqlDialect={state.sqlDialect}
          sqlExtensions={sqlExtensions}
        />
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
