import type { DiagramSchema, RelationshipType, TableColumn } from '@/types'

type ReactFlowNode = {
  data: {
    columns: Array<TableColumn>
    tableName: string
    [key: string]: unknown
  }
  id: string
  position: { x: number; y: number }
  type?: string
}

type ReactFlowEdge = {
  data?: {
    relationType: RelationshipType
    sourceColumnId: string
    targetColumnId: string
  }
  id: string
  source: string
  sourceHandle?: string | null
  target: string
  targetHandle?: string | null
  type?: string
}

export function serializeDiagram(nodes: Array<ReactFlowNode>, edges: Array<ReactFlowEdge>): DiagramSchema {
  const tables = nodes.map((node) => ({
    columns: node.data.columns.map((col) => ({
      constraints: { ...col.constraints },
      id: col.id,
      name: col.name,
      type: col.type,
    })),
    id: node.id,
    name: node.data.tableName,
    position: { x: node.position.x, y: node.position.y },
  }))

  const relationships = edges
    .filter((edge) => edge.data)
    .map((edge) => {
      // Edge source/target are node IDs. sourceHandle/targetHandle contain column info.
      const sourceHandle = edge.sourceHandle ?? ''
      const targetHandle = edge.targetHandle ?? ''

      // Parse column IDs from handles
      // The handle format is `${nodeId}-${columnId}-source/target`
      // Since IDs can contain dashes, we extract the column ID from the node's columns
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)

      let sourceColumnId = ''
      let targetColumnId = ''

      if (sourceNode) {
        for (const col of sourceNode.data.columns) {
          if (sourceHandle === `${edge.source}-${col.id}-source`) {
            sourceColumnId = col.id
            break
          }
        }
      }

      if (targetNode) {
        for (const col of targetNode.data.columns) {
          if (targetHandle === `${edge.target}-${col.id}-target`) {
            targetColumnId = col.id
            break
          }
        }
      }

      return {
        id: edge.id,
        relationType: edge.data!.relationType,
        sourceColumnId,
        sourceTableId: edge.source,
        targetColumnId,
        targetTableId: edge.target,
      }
    })

  return { relationships, tables }
}

export function deserializeDiagram(schema: DiagramSchema): {
  edges: Array<ReactFlowEdge>
  nodes: Array<ReactFlowNode>
} {
  const nodes: Array<ReactFlowNode> = schema.tables.map((table) => ({
    data: {
      columns: table.columns.map((col) => ({
        constraints: { ...col.constraints },
        id: col.id,
        name: col.name,
        type: col.type,
      })),
      // Callbacks are NOT stored — re-attached by the component after deserialization
      onAddColumn: () => {},
      onColumnChange: () => {},
      onDeleteColumn: () => {},
      onDeleteTable: () => {},
      onTableNameChange: () => {},
      tableName: table.name,
    },
    id: table.id,
    position: { x: table.position.x, y: table.position.y },
    type: 'tableNode',
  }))

  const edges: Array<ReactFlowEdge> = schema.relationships.map((rel) => ({
    data: {
      relationType: rel.relationType,
      sourceColumnId: `${rel.sourceTableId}-${rel.sourceColumnId}-source`,
      targetColumnId: `${rel.targetTableId}-${rel.targetColumnId}-target`,
    },
    id: rel.id,
    source: rel.sourceTableId,
    sourceHandle: `${rel.sourceTableId}-${rel.sourceColumnId}-source`,
    target: rel.targetTableId,
    targetHandle: `${rel.targetTableId}-${rel.targetColumnId}-target`,
    type: 'relationship',
  }))

  return { edges, nodes }
}

export function validateDiagramSchema(data: unknown): data is DiagramSchema {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>

  if (!Array.isArray(obj.tables) || !Array.isArray(obj.relationships)) return false

  // Validate tables
  for (const table of obj.tables) {
    if (typeof table !== 'object' || !table) return false
    const t = table as Record<string, unknown>
    if (typeof t.id !== 'string' || typeof t.name !== 'string') return false
    if (!t.position || typeof t.position !== 'object') return false
    const pos = t.position as Record<string, unknown>
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number') return false
    if (!Array.isArray(t.columns)) return false

    for (const col of t.columns) {
      if (typeof col !== 'object' || !col) return false
      const c = col as Record<string, unknown>
      if (typeof c.id !== 'string' || typeof c.name !== 'string' || typeof c.type !== 'string') return false
      if (!c.constraints || typeof c.constraints !== 'object') return false
    }
  }

  // Validate relationships and referential integrity
  const tableIds = new Set((obj.tables as Array<Record<string, unknown>>).map((t) => t.id as string))
  const columnIdsByTable = new Map<string, Set<string>>()
  for (const table of obj.tables as Array<Record<string, unknown>>) {
    const cols = new Set((table.columns as Array<Record<string, unknown>>).map((c) => c.id as string))
    columnIdsByTable.set(table.id as string, cols)
  }

  for (const rel of obj.relationships) {
    if (typeof rel !== 'object' || !rel) return false
    const r = rel as Record<string, unknown>
    if (typeof r.id !== 'string' || typeof r.relationType !== 'string') return false
    if (typeof r.sourceTableId !== 'string' || typeof r.targetTableId !== 'string') return false
    if (typeof r.sourceColumnId !== 'string' || typeof r.targetColumnId !== 'string') return false

    // Referential integrity: FK references must exist
    if (!tableIds.has(r.sourceTableId as string) || !tableIds.has(r.targetTableId as string)) return false

    const sourceCols = columnIdsByTable.get(r.sourceTableId as string)
    const targetCols = columnIdsByTable.get(r.targetTableId as string)
    if (!sourceCols?.has(r.sourceColumnId as string) || !targetCols?.has(r.targetColumnId as string)) return false
  }

  return true
}
