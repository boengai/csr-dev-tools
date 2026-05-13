import type { Connection, EdgeTypes, NodeTypes, OnEdgesChange, OnNodesChange } from '@xyflow/react'

import type { DiagramIndexEntry, RelationshipEdge, SidePanel, TableNode } from '@/types'

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
  activeDiagramId: string | null
  diagramIndex: Array<DiagramIndexEntry>
  handleClosePanel: () => void
  handleDbmlClose: () => void
  handleDeleteDiagram: (id: string) => void
  handleLoadDiagram: (id: string) => void
  handleNewDiagram: () => void
  handleRenameDiagram: (id: string, newName: string) => void
  handleStartRenaming: (id: string, name: string) => void
  renameInputRef: React.RefObject<HTMLInputElement | null>
  renameValue: string
  renamingId: string | null
  setRenameValue: (value: string) => void
  setRenamingId: (id: string | null) => void
}
