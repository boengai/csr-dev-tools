import type { DiagramDocument, DiagramSchema, EditorRelation, EditorTable } from '@/types'
import { createInitialDocument } from '../state'

export const newDiagram = (): DiagramDocument => createInitialDocument()

export const setDiagramName = (doc: DiagramDocument, name: string): DiagramDocument => ({
  ...doc,
  diagramName: name,
})

export const schemaToDocument = (schema: DiagramSchema, base: DiagramDocument): DiagramDocument => {
  const tables: Record<string, EditorTable> = {}
  const tableOrder: Array<string> = []
  for (const t of schema.tables) {
    tables[t.id] = {
      id: t.id,
      name: t.name,
      columns: t.columns.map((c) => ({ ...c, constraints: { ...c.constraints } })),
      position: { ...t.position },
    }
    tableOrder.push(t.id)
  }
  const relations: Record<string, EditorRelation> = {}
  const relationOrder: Array<string> = []
  for (const r of schema.relationships) {
    relations[r.id] = {
      id: r.id,
      source: { tableId: r.sourceTableId, columnId: r.sourceColumnId },
      target: { tableId: r.targetTableId, columnId: r.targetColumnId },
      kind: r.relationType,
    }
    relationOrder.push(r.id)
  }
  return {
    ...base,
    tables,
    tableOrder,
    relations,
    relationOrder,
  }
}
