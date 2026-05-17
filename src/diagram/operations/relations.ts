import type { ColumnRef, DiagramDocument, EditorRelation, RelationId, RelationKind } from '@/types'
import type { EntityIdMinters } from '@/diagram/id-minters'

const columnExists = (doc: DiagramDocument, ref: ColumnRef): boolean => {
  const table = doc.tables[ref.tableId]
  return !!table && table.columns.some((c) => c.id === ref.columnId)
}

export const addRelation = (
  doc: DiagramDocument,
  input: { from: ColumnRef; to: ColumnRef; kind: RelationKind },
  minters: EntityIdMinters,
): { document: DiagramDocument; id: RelationId | null } => {
  if (!columnExists(doc, input.from) || !columnExists(doc, input.to)) {
    return { document: doc, id: null }
  }
  const id = minters.relation()
  const relation: EditorRelation = { id, source: { ...input.from }, target: { ...input.to }, kind: input.kind }
  return {
    document: {
      ...doc,
      relations: { ...doc.relations, [id]: relation },
      relationOrder: [...doc.relationOrder, id],
    },
    id,
  }
}

export const updateRelation = (
  doc: DiagramDocument,
  id: RelationId,
  patch: Partial<Omit<EditorRelation, 'id'>>,
): DiagramDocument => {
  const existing = doc.relations[id]
  if (!existing) return doc
  return {
    ...doc,
    relations: { ...doc.relations, [id]: { ...existing, ...patch } },
  }
}

export const deleteRelation = (doc: DiagramDocument, id: RelationId): DiagramDocument => {
  if (!doc.relations[id]) return doc
  const { [id]: _removed, ...rest } = doc.relations
  return {
    ...doc,
    relations: rest,
    relationOrder: doc.relationOrder.filter((r) => r !== id),
  }
}
