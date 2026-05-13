import type { DiagramDocument } from '@/types'

export const createInitialDocument = (): DiagramDocument => ({
  diagramId: null,
  diagramName: 'Untitled Diagram',
  tables: {},
  tableOrder: [],
  relations: {},
  relationOrder: [],
  dbmlText: '',
  dbmlSource: 'diagram',
  dbmlErrors: [],
})

export const cloneDocument = (doc: DiagramDocument): DiagramDocument => ({
  ...doc,
  tables: Object.fromEntries(
    Object.entries(doc.tables).map(([id, t]) => [
      id,
      {
        ...t,
        columns: t.columns.map((c) => ({
          ...c,
          constraints: { ...c.constraints },
        })),
        position: { ...t.position },
      },
    ]),
  ),
  tableOrder: [...doc.tableOrder],
  relations: Object.fromEntries(
    Object.entries(doc.relations).map(([id, r]) => [
      id,
      {
        ...r,
        source: { ...r.source },
        target: { ...r.target },
      },
    ]),
  ),
  relationOrder: [...doc.relationOrder],
  dbmlErrors: [...doc.dbmlErrors],
})
