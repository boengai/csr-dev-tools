import type { RelationshipType, TableColumn } from '@/types'

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
