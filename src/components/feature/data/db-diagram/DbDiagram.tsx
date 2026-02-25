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
import { useCallback, useEffect, useState } from 'react'

import type { RelationshipEdgeData, RelationshipType, TableColumn, ToolComponentProps } from '@/types'

import { Button, Dialog } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { createDefaultColumn, createDefaultTable, generateId } from '@/utils'

import '@xyflow/react/dist/style.css'
import type { RelationshipEdge } from './RelationshipEdge'
import type { TableNode } from './TableNode'

import { RelationshipEdgeComponent } from './RelationshipEdge'
import { TableNodeComponent } from './TableNode'

const nodeTypes: NodeTypes = { tableNode: TableNodeComponent }
const edgeTypes: EdgeTypes = { relationship: RelationshipEdgeComponent }

const toolEntry = TOOL_REGISTRY_MAP['db-diagram']

const DiagramCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationshipEdge>([])
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [tableCount, setTableCount] = useState(0)

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

  const handleAddTable = useCallback(() => {
    const { columns, tableName } = createDefaultTable(tableCount)
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    // Placeholder callbacks satisfy TableNodeData type — overwritten by nodesWithCallbacks on same render
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
      // Remove edges connected to this column
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

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 gap-2 border-b border-gray-800 bg-gray-950 px-3 py-2">
        <button
          className="bg-blue-600 text-xs hover:bg-blue-500 rounded px-3 py-1.5 font-medium text-white transition-colors"
          data-testid="add-table-btn"
          onClick={handleAddTable}
          type="button"
        >
          + Add Table
        </button>
        <button
          className="text-xs rounded bg-gray-800 px-3 py-1.5 font-medium text-gray-300 transition-colors hover:bg-gray-700"
          data-testid="fit-view-btn"
          onClick={() => fitView({ padding: 0.2 })}
          type="button"
        >
          Fit View
        </button>
        <button
          className="text-xs rounded bg-gray-800 px-3 py-1.5 font-medium text-gray-300 transition-colors hover:bg-gray-700"
          data-testid="clear-all-btn"
          onClick={handleClearAll}
          type="button"
        >
          Clear All
        </button>
      </div>

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
          // Remove proOptions to show React Flow attribution, or subscribe to React Flow Pro
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <MiniMap />
          <Background gap={16} variant={BackgroundVariant.Dots} />
        </ReactFlow>
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
