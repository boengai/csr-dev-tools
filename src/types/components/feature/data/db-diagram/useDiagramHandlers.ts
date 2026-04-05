import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { DiagramAction, DiagramState, RelationshipEdge, TableNode } from '@/types'

export type UseDiagramHandlersArgs = {
  dispatch: Dispatch<DiagramAction>
  edges: Array<RelationshipEdge>
  nameInputRef: RefObject<HTMLInputElement | null>
  nodes: Array<TableNode>
  renameInputRef: RefObject<HTMLInputElement | null>
  setEdges: Dispatch<SetStateAction<Array<RelationshipEdge>>>
  setNodes: Dispatch<SetStateAction<Array<TableNode>>>
  state: DiagramState
}
