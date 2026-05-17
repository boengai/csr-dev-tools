import type { ColumnId, RelationId, TableId } from '@/types'

export type EntityIdMinters = {
  column: () => ColumnId
  relation: () => RelationId
  table: () => TableId
}

const makeDefaultMinter = (prefix: string): (() => string) => {
  let n = 0
  return () => `${prefix}_${Date.now().toString(36)}_${(++n).toString(36)}`
}

export const createDefaultIdMinters = (): EntityIdMinters => ({
  column: makeDefaultMinter('c'),
  relation: makeDefaultMinter('r'),
  table: makeDefaultMinter('t'),
})

const makeSequentialMinter = (prefix: string): (() => string) => {
  let n = 0
  return () => `${prefix}_${++n}`
}

export const createSequentialIdMinters = (): EntityIdMinters => ({
  column: makeSequentialMinter('c'),
  relation: makeSequentialMinter('r'),
  table: makeSequentialMinter('t'),
})
