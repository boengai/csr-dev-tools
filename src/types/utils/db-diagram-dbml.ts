import type { ColumnType, RelationshipType } from '@/types'

export type ParsedTable = {
  columns: Array<{
    constraints: { isForeignKey: boolean; isNullable: boolean; isPrimaryKey: boolean; isUnique: boolean }
    id: string
    inlineRef?: { column: string; table: string }
    name: string
    type: ColumnType
  }>
  lineNumber: number
  name: string
}

export type ParsedRef = {
  lineNumber: number
  relationType: RelationshipType
  reversed: boolean
  sourceColumn: string
  sourceTable: string
  targetColumn: string
  targetTable: string
}
