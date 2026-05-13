import { useEffect, useMemo, useState } from 'react'
import type { Connection, NodeChange } from '@xyflow/react'
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, applyNodeChanges } from '@xyflow/react'

import type { RelationshipType, TableNode } from '@/types'

import { documentToFlow } from '@/diagram/projections'

import { useDiagram } from './DiagramContext'
import { RelationshipEdgeComponent } from './RelationshipEdge'
import { TableNodeComponent } from './TableNode'

const nodeTypes = { tableNode: TableNodeComponent }
const edgeTypes = { relationship: RelationshipEdgeComponent }

export const DiagramCanvas = () => {
  const { document, editor } = useDiagram()

  const projected = useMemo(() => documentToFlow(document), [document])

  // Live-drag state: ephemeral presentational copy of node positions for smooth drag.
  const [liveNodes, setLiveNodes] = useState<Array<TableNode>>(projected.nodes)

  // Re-sync live state when the document changes (addTable, import, undo, etc.).
  useEffect(() => {
    setLiveNodes(projected.nodes)
  }, [projected.nodes])

  // Bind node callbacks to editor methods, closing over the editor instance.
  const nodesWithCallbacks: Array<TableNode> = useMemo(
    () =>
      liveNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onAddColumn: () =>
            editor.addColumn(n.id, {
              name: 'column',
              type: 'TEXT',
              constraints: { isPrimaryKey: false, isForeignKey: false, isNullable: true, isUnique: false },
            }),
          onColumnChange: (columnId: string, patch: Parameters<typeof editor.updateColumn>[2]) =>
            editor.updateColumn(n.id, columnId, patch),
          onDeleteColumn: (columnId: string) => editor.deleteColumn(n.id, columnId),
          onDeleteTable: () => editor.deleteTable(n.id),
          onTableNameChange: (name: string) => editor.renameTable(n.id, name),
        },
      })),
    [liveNodes, editor],
  )

  const onNodesChange = (changes: Array<NodeChange<TableNode>>) => {
    setLiveNodes((curr) => applyNodeChanges(changes, curr))
    for (const change of changes) {
      if (change.type === 'position' && change.dragging === false && change.position) {
        editor.moveTable(change.id, change.position)
      }
    }
  }

  const onConnect = (params: Connection) => {
    if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) return
    editor.addRelation({
      from: { tableId: params.source, columnId: params.sourceHandle },
      to: { tableId: params.target, columnId: params.targetHandle },
      kind: '1:N',
    })
  }

  // RelationshipEdgeComponent communicates via window custom events (not ReactFlow
  // callbacks) to avoid prop-drilling through the edge type registry.
  useEffect(() => {
    const handleRelationChange = (e: Event) => {
      const { edgeId, relationType } = (e as CustomEvent<{ edgeId: string; relationType: RelationshipType }>).detail
      editor.updateRelation(edgeId, { kind: relationType })
    }
    window.addEventListener('db-diagram-relation-change', handleRelationChange)
    return () => window.removeEventListener('db-diagram-relation-change', handleRelationChange)
  }, [editor])

  useEffect(() => {
    const handleEdgeDelete = (e: Event) => {
      const { edgeId } = (e as CustomEvent<{ edgeId: string }>).detail
      editor.deleteRelation(edgeId)
    }
    window.addEventListener('db-diagram-edge-delete', handleEdgeDelete)
    return () => window.removeEventListener('db-diagram-edge-delete', handleEdgeDelete)
  }, [editor])

  return (
    <div className="flex-1">
      <ReactFlow
        colorMode="dark"
        edgeTypes={edgeTypes}
        edges={projected.edges}
        fitView
        nodeTypes={nodeTypes}
        nodes={nodesWithCallbacks}
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
}
