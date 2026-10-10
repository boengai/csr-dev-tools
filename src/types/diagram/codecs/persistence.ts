import type { DiagramStore, RelationshipType, TableColumn } from '@/types'

export type ReactFlowNode = {
  data: {
    columns: Array<TableColumn>
    tableName: string
    [key: string]: unknown
  }
  id: string
  position: { x: number; y: number }
  type?: string
}

export type ReactFlowEdge = {
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

export type DiagramStoreReadResult = { kind: 'ok'; store: DiagramStore } | { kind: 'corrupt'; raw: string }
