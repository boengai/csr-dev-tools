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
