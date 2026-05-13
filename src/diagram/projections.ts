import type { DiagramDocument, RelationshipEdge, TableNode } from '@/types'

export const documentToFlow = (doc: DiagramDocument): { nodes: Array<TableNode>; edges: Array<RelationshipEdge> } => {
  const nodes: Array<TableNode> = doc.tableOrder
    .map((id) => doc.tables[id])
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({
      id: t.id,
      type: 'tableNode',
      position: t.position,
      data: {
        columns: t.columns,
        tableName: t.name,
        // Callbacks bound in DiagramCanvas (Task 14); placeholders here.
        onAddColumn: () => undefined,
        onColumnChange: () => undefined,
        onDeleteColumn: () => undefined,
        onDeleteTable: () => undefined,
        onTableNameChange: () => undefined,
      },
    }))

  const edges: Array<RelationshipEdge> = doc.relationOrder
    .map((id) => doc.relations[id])
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({
      id: r.id,
      source: r.source.tableId,
      target: r.target.tableId,
      type: 'relationship',
      data: {
        relationType: r.kind,
        sourceColumnId: r.source.columnId,
        targetColumnId: r.target.columnId,
      },
    }))

  return { nodes, edges }
}
