import type { ColumnType, DiagramSchema } from '@/types'

export type ParseResult = {
  errors: Array<{ line: number; message: string }>
  relationships: DiagramSchema['relationships']
  tables: DiagramSchema['tables']
}

export type ParsedColumn = {
  constraints: {
    isForeignKey: boolean
    isNullable: boolean
    isPrimaryKey: boolean
    isUnique: boolean
  }
  id: string
  name: string
  type: ColumnType
}

export type FkRef = {
  referencedColumn: string
  referencedTable: string
  sourceColumn: string
}
