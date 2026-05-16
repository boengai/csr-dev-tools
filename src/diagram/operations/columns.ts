import type { ColumnId, DiagramDocument, TableColumn, TableId } from '@/types'

const colIdSeq = (() => {
  let n = 0
  return () => `c_${Date.now().toString(36)}_${(++n).toString(36)}`
})()

export const addColumn = (
  doc: DiagramDocument,
  tableId: TableId,
  column: Omit<TableColumn, 'id'>,
): { document: DiagramDocument; id: ColumnId | null } => {
  const table = doc.tables[tableId]
  if (!table) return { document: doc, id: null }
  const id = colIdSeq()
  const next: TableColumn = { ...column, id }
  return {
    document: {
      ...doc,
      tables: { ...doc.tables, [tableId]: { ...table, columns: [...table.columns, next] } },
    },
    id,
  }
}

export const updateColumn = (
  doc: DiagramDocument,
  tableId: TableId,
  columnId: ColumnId,
  patch: Partial<TableColumn>,
): DiagramDocument => {
  const table = doc.tables[tableId]
  if (!table) return doc
  const idx = table.columns.findIndex((c) => c.id === columnId)
  if (idx === -1) return doc
  const nextColumns = [...table.columns]
  nextColumns[idx] = {
    ...nextColumns[idx],
    ...patch,
    constraints: { ...nextColumns[idx].constraints, ...patch.constraints },
  }
  return {
    ...doc,
    tables: { ...doc.tables, [tableId]: { ...table, columns: nextColumns } },
  }
}

export const deleteColumn = (doc: DiagramDocument, tableId: TableId, columnId: ColumnId): DiagramDocument => {
  const table = doc.tables[tableId]
  if (!table) return doc
  if (!table.columns.some((c) => c.id === columnId)) return doc
  const remainingRelationOrder = doc.relationOrder.filter((rId) => {
    const r = doc.relations[rId]
    if (!r) return false
    const touchesDeleted =
      (r.source.tableId === tableId && r.source.columnId === columnId) ||
      (r.target.tableId === tableId && r.target.columnId === columnId)
    return !touchesDeleted
  })
  const remainingRelations: typeof doc.relations = {}
  for (const rId of remainingRelationOrder) remainingRelations[rId] = doc.relations[rId]
  return {
    ...doc,
    tables: {
      ...doc.tables,
      [tableId]: { ...table, columns: table.columns.filter((c) => c.id !== columnId) },
    },
    relations: remainingRelations,
    relationOrder: remainingRelationOrder,
  }
}
