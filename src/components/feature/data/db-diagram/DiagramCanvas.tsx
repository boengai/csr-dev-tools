import type { Connection, NodeChange } from '@xyflow/react'
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, applyNodeChanges } from '@xyflow/react'
import { useCallback, useMemo, useState } from 'react'

import { createFlowProjector, parseColumnHandleId } from '@/diagram/projections'
import type { TableNode } from '@/types'

import { useDiagram } from './DiagramContext'
import { RelationshipEdgeComponent } from './RelationshipEdge'
import { TableNodeComponent } from './TableNode'

const nodeTypes = { tableNode: TableNodeComponent }
const edgeTypes = { relationship: RelationshipEdgeComponent }

const MINIMAP_PALETTE = [
  'oklch(0.55 0.22 310)',
  'oklch(0.65 0.12 260)',
  'oklch(0.6 0.15 240)',
  'oklch(0.65 0.18 165)',
  'oklch(0.75 0.15 85)',
  'oklch(0.6 0.2 15)',
  'oklch(0.7 0.15 30)',
  'oklch(0.6 0.18 200)',
]

// Reconcile xyflow's live node state with a fresh projection. Nodes whose
// projection is unchanged keep their live object (drag position, measured
// size, selection, identity); changed nodes take the projection but keep
// selection and measured size so xyflow doesn't flicker or deselect.
const reconcileNodes = (
  projected: Array<TableNode>,
  previousProjected: Array<TableNode>,
  live: Array<TableNode>,
): Array<TableNode> => {
  const previousById = new Map(previousProjected.map((n) => [n.id, n]))
  const liveById = new Map(live.map((n) => [n.id, n]))
  return projected.map((node) => {
    const current = liveById.get(node.id)
    if (!current) return node
    if (previousById.get(node.id) === node) return current
    return { ...node, measured: current.measured, selected: current.selected }
  })
}

export const DiagramCanvas = () => {
  const { document, editor } = useDiagram()

  const projectFlow = useMemo(() => createFlowProjector(), [])
  const projected = useMemo(() => projectFlow(document), [document, projectFlow])

  // xyflow drives drags through onNodesChange, so the canvas keeps a live copy
  // of the nodes; the document is only updated when a drag ends. When the
  // document changes, reconcile during render (no mirroring effect / extra
  // commit) — see "adjusting state when a prop changes" in the React docs.
  const [liveNodes, setLiveNodes] = useState<Array<TableNode>>(projected.nodes)
  const [syncedNodes, setSyncedNodes] = useState<Array<TableNode>>(projected.nodes)
  if (syncedNodes !== projected.nodes) {
    setSyncedNodes(projected.nodes)
    setLiveNodes(reconcileNodes(projected.nodes, syncedNodes, liveNodes))
  }

  const onNodesChange = useCallback(
    (changes: Array<NodeChange<TableNode>>) => {
      setLiveNodes((curr) => applyNodeChanges(changes, curr))
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === false && change.position) {
          editor.moveTable(change.id, change.position)
        }
      }
    },
    [editor],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return
      const fromColumn = parseColumnHandleId(params.sourceHandle, params.source, 'source')
      const toColumn = parseColumnHandleId(params.targetHandle, params.target, 'target')
      if (!fromColumn || !toColumn) return
      editor.addRelation({
        from: { tableId: params.source, columnId: fromColumn },
        to: { tableId: params.target, columnId: toColumn },
        kind: '1:N',
      })
    },
    [editor],
  )

  const tableIndex = useMemo(() => new Map(document.tableOrder.map((id, i) => [id, i])), [document.tableOrder])
  const minimapNodeColor = useCallback(
    (node: { id: string }) => MINIMAP_PALETTE[(tableIndex.get(node.id) ?? 0) % MINIMAP_PALETTE.length],
    [tableIndex],
  )

  return (
    <div className="flex-1">
      <ReactFlow
        colorMode="dark"
        edgeTypes={edgeTypes}
        edges={projected.edges}
        fitView
        nodeTypes={nodeTypes}
        nodes={liveNodes}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap
          bgColor="oklch(0.12 0.008 270)"
          maskColor="rgba(0, 0, 0, 0.6)"
          maskStrokeColor="oklch(0.55 0.22 310)"
          maskStrokeWidth={2}
          nodeColor={minimapNodeColor}
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
}
