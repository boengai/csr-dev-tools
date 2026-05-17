import type { ColumnId, ColumnType, TableColumn } from '@/types'

export const COLUMN_TYPES: Array<ColumnType> = [
  'INT',
  'BIGINT',
  'SERIAL',
  'VARCHAR',
  'TEXT',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'FLOAT',
  'DECIMAL',
  'UUID',
  'JSON',
  'BLOB',
]

export const createDefaultColumn = (
  name = 'column',
  isPrimaryKey = false,
  mintColumn: () => ColumnId,
): TableColumn => ({
  constraints: {
    isForeignKey: false,
    isNullable: !isPrimaryKey,
    isPrimaryKey,
    isUnique: isPrimaryKey,
  },
  id: mintColumn(),
  name,
  type: isPrimaryKey ? 'INT' : 'VARCHAR',
})

export function gridLayoutPositions(count: number): Array<{ x: number; y: number }> {
  const GRID_COLS = 3
  const H_SPACING = 600
  const V_SPACING = 550

  return Array.from({ length: count }, (_, i) => ({
    x: (i % GRID_COLS) * H_SPACING,
    y: Math.floor(i / GRID_COLS) * V_SPACING,
  }))
}

export const createDefaultTable = (tableCount: number, mintColumn: () => ColumnId) => {
  const tableName = `table_${tableCount + 1}`
  const idColumn = createDefaultColumn('id', true, mintColumn)
  return {
    columns: [idColumn],
    tableName,
  }
}
