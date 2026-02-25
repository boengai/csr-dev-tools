import type { ColumnType, TableColumn } from '@/types'

let counter = 0

export const generateId = () => {
  counter += 1
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`
}

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

export const createDefaultColumn = (name = 'column', isPrimaryKey = false): TableColumn => ({
  constraints: {
    isForeignKey: false,
    isNullable: !isPrimaryKey,
    isPrimaryKey,
    isUnique: isPrimaryKey,
  },
  id: generateId(),
  name,
  type: isPrimaryKey ? 'INT' : 'VARCHAR',
})

export const createDefaultTable = (tableCount: number) => {
  const tableName = `table_${tableCount + 1}`
  const idColumn = createDefaultColumn('id', true)
  return {
    columns: [idColumn],
    tableName,
  }
}
