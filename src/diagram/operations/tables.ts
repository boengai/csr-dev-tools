import type { DiagramDocument, EditorTable, TableId } from '@/types'
import { createDefaultColumn } from '@/utils/db-diagram'

const tableIdSeq = (() => {
  let n = 0
  return () => `t_${Date.now().toString(36)}_${(++n).toString(36)}`
})()

const GRID_X = 300
const GRID_Y = 250
const GRID_COLS = 4

const defaultPosition = (existingCount: number) => ({
  x: (existingCount % GRID_COLS) * GRID_X + 40,
  y: Math.floor(existingCount / GRID_COLS) * GRID_Y + 40,
})

export const addTable = (
  doc: DiagramDocument,
  input: { name: string; position?: { x: number; y: number } },
): { document: DiagramDocument; id: TableId } => {
  const id = tableIdSeq()
  const table: EditorTable = {
    id,
    name: input.name,
    columns: [createDefaultColumn('id', true)],
    position: input.position ?? defaultPosition(doc.tableOrder.length),
  }
  return {
    document: {
      ...doc,
      tables: { ...doc.tables, [id]: table },
      tableOrder: [...doc.tableOrder, id],
    },
    id,
  }
}

export const renameTable = (doc: DiagramDocument, id: TableId, name: string): DiagramDocument => {
  const table = doc.tables[id]
  if (!table) return doc
  return {
    ...doc,
    tables: { ...doc.tables, [id]: { ...table, name } },
  }
}

export const moveTable = (
  doc: DiagramDocument,
  id: TableId,
  position: { x: number; y: number },
): DiagramDocument => {
  const table = doc.tables[id]
  if (!table) return doc
  return {
    ...doc,
    tables: { ...doc.tables, [id]: { ...table, position: { ...position } } },
  }
}

export const deleteTable = (doc: DiagramDocument, id: TableId): DiagramDocument => {
  if (!doc.tables[id]) return doc
  const { [id]: _removed, ...remainingTables } = doc.tables
  const remainingRelationOrder = doc.relationOrder.filter((rId) => {
    const r = doc.relations[rId]
    return r && r.source.tableId !== id && r.target.tableId !== id
  })
  const remainingRelations: typeof doc.relations = {}
  for (const rId of remainingRelationOrder) remainingRelations[rId] = doc.relations[rId]
  return {
    ...doc,
    tables: remainingTables,
    tableOrder: doc.tableOrder.filter((t) => t !== id),
    relations: remainingRelations,
    relationOrder: remainingRelationOrder,
  }
}
