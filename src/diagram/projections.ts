import type {
  ColumnId,
  DiagramDocument,
  DiagramFlowProjection,
  EditorRelation,
  EditorTable,
  HandleKind,
  RelationshipEdge,
  TableId,
  TableNode,
} from '@/types'

// Each column row renders one target (left) and one source (right) handle.
export const columnHandleId = (tableId: TableId, columnId: ColumnId, kind: HandleKind): string =>
  `${tableId}-${columnId}-${kind}`

// Inverse of columnHandleId for a handle on `tableId`; null if it doesn't match.
export const parseColumnHandleId = (handleId: string, tableId: TableId, kind: HandleKind): ColumnId | null => {
  const prefix = `${tableId}-`
  const suffix = `-${kind}`
  if (!handleId.startsWith(prefix) || !handleId.endsWith(suffix)) return null
  const columnId = handleId.slice(prefix.length, handleId.length - suffix.length)
  return columnId || null
}

const tableToNode = (t: EditorTable): TableNode => ({
  id: t.id,
  type: 'tableNode',
  position: t.position,
  data: { columns: t.columns, tableName: t.name },
})

const relationToEdge = (r: EditorRelation): RelationshipEdge => ({
  id: r.id,
  source: r.source.tableId,
  sourceHandle: columnHandleId(r.source.tableId, r.source.columnId, 'source'),
  target: r.target.tableId,
  targetHandle: columnHandleId(r.target.tableId, r.target.columnId, 'target'),
  type: 'relationship',
  data: {
    relationType: r.kind,
    sourceColumnId: r.source.columnId,
    targetColumnId: r.target.columnId,
  },
})

const project = (
  doc: DiagramDocument,
  toNode: (t: EditorTable) => TableNode,
  toEdge: (r: EditorRelation) => RelationshipEdge,
): DiagramFlowProjection => ({
  nodes: doc.tableOrder
    .map((id) => doc.tables[id])
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map(toNode),
  edges: doc.relationOrder
    .map((id) => doc.relations[id])
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(toEdge),
})

export const documentToFlow = (doc: DiagramDocument): DiagramFlowProjection => project(doc, tableToNode, relationToEdge)

// Memoizing variant: operations replace only the tables/relations they touch,
// so caching by object identity keeps unchanged nodes/edges referentially
// stable across document updates (lets memoized node components skip renders).
export const createFlowProjector = (): ((doc: DiagramDocument) => DiagramFlowProjection) => {
  const nodes = new WeakMap<EditorTable, TableNode>()
  const edges = new WeakMap<EditorRelation, RelationshipEdge>()
  const cached =
    <K extends object, V>(cache: WeakMap<K, V>, build: (key: K) => V) =>
    (key: K): V => {
      let value = cache.get(key)
      if (!value) {
        value = build(key)
        cache.set(key, value)
      }
      return value
    }
  const toNode = cached(nodes, tableToNode)
  const toEdge = cached(edges, relationToEdge)
  return (doc) => project(doc, toNode, toEdge)
}
