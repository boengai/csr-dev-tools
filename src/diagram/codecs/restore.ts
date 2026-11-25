import type { DiagramIndexEntry, DiagramSchema, TableColumn } from '@/types'
import { isRecord, restoreJson } from '@/utils/restore-json'

const EPOCH = new Date(0).toISOString()

// The defaults stored items are laid over. An entry's blank `id` means none was stored.
const INDEX_ENTRY: DiagramIndexEntry = {
  createdAt: EPOCH,
  id: '',
  name: 'Untitled Diagram',
  tableCount: 0,
  updatedAt: EPOCH,
}
const COLUMN: TableColumn = {
  constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false },
  id: '',
  name: 'column',
  type: 'VARCHAR',
}
// Unnamed here, `columns` is kept as stored; restoreSchema restores that list.
const TABLE: { columns?: unknown; id: string; name: string; position: { x: number; y: number } } = {
  id: '',
  name: 'table',
  position: { x: 0, y: 0 },
}
const RELATIONSHIP: DiagramSchema['relationships'][number] = {
  id: '',
  relationType: '1:N',
  sourceColumnId: '',
  sourceTableId: '',
  targetColumnId: '',
  targetTableId: '',
}

// A diagram whose entry was lost is listed again, so it can still be opened.
export const restoreIndex = (stored: unknown, diagrams: Record<string, unknown>): Array<DiagramIndexEntry> => {
  const index = restoreJson(stored, [INDEX_ENTRY]).filter(({ id }) => id !== '')
  const listed = new Set(index.map(({ id }) => id))
  const lost = Object.keys(diagrams).filter((id) => !listed.has(id) && isRecord(diagrams[id]))
  return [...index, ...lost.map((id) => ({ ...INDEX_ENTRY, id }))]
}

// An item stored without an id is kept, under an unused one made from its position.
const restoreList = <T extends { id: string }>(stored: unknown, item: T, idPrefix: string): Array<T> => {
  if (!Array.isArray(stored)) return []
  const items = stored.filter(isRecord)
  const taken = new Set(items.map(({ id }) => id))
  return items.map((value, i) => {
    let id = `${idPrefix}_${i}`
    while (taken.has(id)) id += '_'
    return restoreJson(value, { ...item, id })
  })
}

const toCoordinate = (value: unknown): number => (Number.isFinite(value) ? (value as number) : 0)

export const restoreSchema = (stored: Record<string, unknown>): DiagramSchema => {
  const tables = restoreList(stored.tables, TABLE, 't').map((table) => ({
    ...table,
    columns: restoreList(table.columns, COLUMN, 'c'),
    position: { x: toCoordinate(table.position.x), y: toCoordinate(table.position.y) },
  }))
  const tableIds = new Set(tables.map(({ id }) => id))
  const relationships = restoreList(stored.relationships, RELATIONSHIP, 'r').filter(
    ({ sourceTableId, targetTableId }) => tableIds.has(sourceTableId) && tableIds.has(targetTableId),
  )
  return { relationships, tables }
}
