import type { Connection, EdgeTypes, NodeTypes, OnEdgesChange, OnNodesChange } from '@xyflow/react'

import type { RelationshipEdge, SidePanel, TableNode } from '@/types'

export * from './dbmlEditorPanel'
export * from './diagramContext'
export * from './diagramListPanel'
export * from './diagramSidePanel'
export * from './diagramWorkspace'
export * from './diagramToolbar'
export * from './exportMermaidPanel'
export * from './exportSqlPanel'
export * from './exportTypescriptPanel'
export * from './importJsonSchemaPanel'
export * from './importSqlPanel'

// ---------------------------------------------------------------------------
// DiagramFlowCanvas - extracted ReactFlow rendering
// ---------------------------------------------------------------------------

export type DiagramFlowCanvasProps = {
  edgeTypes: EdgeTypes
  edges: Array<RelationshipEdge>
  nodeTypes: NodeTypes
  nodesWithCallbacks: Array<TableNode>
  onConnect: (connection: Connection) => void
  onEdgesChange: OnEdgesChange<RelationshipEdge>
  onNodesChange: OnNodesChange<TableNode>
}

// ---------------------------------------------------------------------------
// SidePanelRenderer - extracted conditional side panel rendering
// ---------------------------------------------------------------------------

export type SidePanelRendererProps = {
  activePanel: SidePanel
  handleClosePanel: () => void
  handleDbmlClose: () => void
}
