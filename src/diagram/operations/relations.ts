import type { ColumnRef, DiagramDocument, EditorRelation, RelationId, RelationKind } from '@/types'

const relIdSeq = (() => {
  let n = 0
  return () => `r_${Date.now().toString(36)}_${(++n).toString(36)}`
})()

const columnExists = (doc: DiagramDocument, ref: ColumnRef): boolean => {
  const table = doc.tables[ref.tableId]
  return !!table && table.columns.some((c) => c.id === ref.columnId)
}

export const addRelation = (
  doc: DiagramDocument,
  input: { from: ColumnRef; to: ColumnRef; kind: RelationKind },
): { document: DiagramDocument; id: RelationId | null } => {
  if (!columnExists(doc, input.from) || !columnExists(doc, input.to)) {
    return { document: doc, id: null }
  }
  const id = relIdSeq()
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
