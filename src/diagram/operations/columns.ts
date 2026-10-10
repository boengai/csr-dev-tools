import type { ColumnId, DiagramDocument, EntityIdMinters, TableColumn, TableId } from '@/types'

import { cleanupDanglingRelations } from './relations'

export const addColumn = (
  doc: DiagramDocument,
  tableId: TableId,
  column: Omit<TableColumn, 'id'>,
  minters: EntityIdMinters,
): { document: DiagramDocument; id: ColumnId | null } => {
  const table = doc.tables[tableId]
  if (!table) return { document: doc, id: null }
  const id = minters.column()
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
  const { relations, relationOrder } = cleanupDanglingRelations(
    doc,
    (r) =>
      (r.source.tableId === tableId && r.source.columnId === columnId) ||
      (r.target.tableId === tableId && r.target.columnId === columnId),
  )
  return {
    ...doc,
    tables: {
      ...doc.tables,
      [tableId]: { ...table, columns: table.columns.filter((c) => c.id !== columnId) },
    },
    relations,
    relationOrder,
  }
}
