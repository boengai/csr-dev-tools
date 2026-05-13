import { json } from '@codemirror/lang-json'
import { sql as sqlLang } from '@codemirror/lang-sql'
import type { EdgeTypes, NodeTypes } from '@xyflow/react'
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
import type { RelationshipEdge, TableNode, ToolComponentProps } from '@/types'

import '@xyflow/react/dist/style.css'
import type { DiagramFlowCanvasProps, SidePanelRendererProps } from '@/types/components/feature/data/db-diagram/index'

import { DbmlEditorPanel } from './DbmlEditorPanel'
import { DiagramListPanel } from './DiagramListPanel'
import { diagramReducer, initialDiagramState } from './diagramReducer'
import { DiagramToolbar } from './DiagramToolbar'
import { ExportMermaidPanel } from './ExportMermaidPanel'
import { ExportSqlPanel } from './ExportSqlPanel'
import { ExportTypescriptPanel } from './ExportTypescriptPanel'
import { ImportJsonSchemaPanel } from './ImportJsonSchemaPanel'
import { ImportSqlPanel } from './ImportSqlPanel'
import { RelationshipEdgeComponent } from './RelationshipEdge'
import { TableNodeComponent } from './TableNode'
import { useDiagramHandlers } from './useDiagramHandlers'

const nodeTypes: NodeTypes = { tableNode: TableNodeComponent }
const edgeTypes: EdgeTypes = { relationship: RelationshipEdgeComponent }

const toolEntry = TOOL_REGISTRY_MAP['db-diagram']

// ---------------------------------------------------------------------------
// DiagramFlowCanvas - extracted ReactFlow rendering
// ---------------------------------------------------------------------------
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
const SidePanelRenderer = ({
  activePanel,
  activeDiagramId,
  dbmlErrors,
  dbmlText,
  diagramIndex,
  generatedMermaid,
  generatedTypescript,
  handleClosePanel,
  handleDbmlChange,
  handleDbmlClose,
  handleDeleteDiagram,
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
          onClose={handleClosePanel}
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
          generatedTypescript={generatedTypescript}
          handleClosePanel={handleClosePanel}
          handleDbmlChange={handleDbmlChange}
          handleDbmlClose={handleDbmlClose}
          handleDeleteDiagram={handleDeleteDiagram}
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
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

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
