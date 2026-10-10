import type { ColumnRef, DiagramDocument, EditorRelation, EntityIdMinters, RelationId, RelationKind } from '@/types'

const columnExists = (doc: DiagramDocument, ref: ColumnRef): boolean => {
  const table = doc.tables[ref.tableId]
  return !!table && table.columns.some((c) => c.id === ref.columnId)
}

export const cleanupDanglingRelations = (
  doc: DiagramDocument,
  isDangling: (r: EditorRelation) => boolean,
): { relations: DiagramDocument['relations']; relationOrder: DiagramDocument['relationOrder'] } => {
  const relationOrder = doc.relationOrder.filter((rId) => {
    const r = doc.relations[rId]
    return !!r && !isDangling(r)
  })
  const relations: DiagramDocument['relations'] = {}
  for (const rId of relationOrder) relations[rId] = doc.relations[rId]
  return { relations, relationOrder }
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
