import type { Connection, EdgeTypes, NodeTypes, OnEdgesChange, OnNodesChange } from '@xyflow/react'

import type { RelationshipEdge, SidePanel, TableNode } from '@/types'

export // ---------------------------------------------------------------------------
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

export // ---------------------------------------------------------------------------
// SidePanelRenderer - extracted conditional side panel rendering
// ---------------------------------------------------------------------------

type SidePanelRendererProps = {
  activePanel: SidePanel
  handleClosePanel: () => void
  handleDbmlClose: () => void
}
