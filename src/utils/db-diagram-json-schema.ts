import type { ColumnType, DiagramSchema } from '@/types'
import type { ParseResult } from '@/utils/db-diagram-import'

import { generateId } from '@/utils/db-diagram'

type JsonSchemaProperty = {
  $ref?: string
  description?: string
  format?: string
  items?: JsonSchemaProperty
  type?: string
}

type JsonSchemaDefinition = {
  properties?: Record<string, JsonSchemaProperty>
  required?: Array<string>
  type?: string
}

type JsonSchemaRoot = {
  $defs?: Record<string, JsonSchemaDefinition>
  definitions?: Record<string, JsonSchemaDefinition>
}

const JSON_TYPE_MAP: Record<string, ColumnType> = {
  array: 'JSON',
  boolean: 'BOOLEAN',
  integer: 'INT',
  number: 'FLOAT',
  object: 'JSON',
  string: 'VARCHAR',
}

function resolveRefName(ref: string): string | null {
  // Handle $ref: "#/definitions/User" or "#/$defs/User"
  const match = ref.match(/#\/(?:definitions|\$defs)\/(.+)/)
  return match ? match[1] : null
}

function mapJsonType(prop: JsonSchemaProperty): ColumnType {
  if (prop.$ref) return 'INT' // FK reference — maps to an ID column
  if (!prop.type) return 'TEXT'
  return JSON_TYPE_MAP[prop.type] ?? 'TEXT'
}

export function parseJsonSchema(schema: object): ParseResult {
  const root = schema as JsonSchemaRoot
  const definitions = root.definitions ?? root.$defs

  if (!definitions || typeof definitions !== 'object') {
    return { errors: [], relationships: [], tables: [] }
  }

  const GRID_COLS = 3
  const H_SPACING = 300
  const V_SPACING = 250

  const tables: DiagramSchema['tables'] = []
  const relationships: DiagramSchema['relationships'] = []
  const errors: ParseResult['errors'] = []

  // First pass: create tables
  const tableByDefName = new Map<string, DiagramSchema['tables'][number]>()
  let tableIndex = 0

  for (const [defName, def] of Object.entries(definitions)) {
    if (!def || typeof def !== 'object') {
      errors.push({ line: 0, message: `Skipped definition "${defName}": not a valid object` })
      continue
    }

    const requiredSet = new Set(def.required ?? [])
    const columns: DiagramSchema['tables'][number]['columns'] = []

    if (def.properties) {
      for (const [propName, prop] of Object.entries(def.properties)) {
        if (!prop || typeof prop !== 'object') continue

        const isPk = propName === 'id'
        const isRequired = requiredSet.has(propName)

        columns.push({
          constraints: {
            isForeignKey: !!prop.$ref,
            isNullable: !isRequired && !isPk,
            isPrimaryKey: isPk,
            isUnique: isPk,
          },
          id: generateId(),
          name: propName,
          type: mapJsonType(prop),
        })
      }
    }

    const table: DiagramSchema['tables'][number] = {
      columns,
      id: generateId(),
      name: defName,
      position: {
        x: (tableIndex % GRID_COLS) * H_SPACING,
        y: Math.floor(tableIndex / GRID_COLS) * V_SPACING,
      },
    }

    tables.push(table)
    tableByDefName.set(defName, table)
    tableIndex++
  }

  // Second pass: create relationships from $ref
  for (const [defName, def] of Object.entries(definitions)) {
    if (!def?.properties) continue

    const sourceTable = tableByDefName.get(defName)
    if (!sourceTable) continue

    for (const [propName, prop] of Object.entries(def.properties)) {
      if (!prop?.$ref) continue

      const refName = resolveRefName(prop.$ref)
      if (!refName) continue

      const targetTable = tableByDefName.get(refName)
      if (!targetTable) continue

      const sourceCol = sourceTable.columns.find((c) => c.name === propName)
      // Find the PK of the referenced table (or first column)
      const targetCol = targetTable.columns.find((c) => c.constraints.isPrimaryKey) ?? targetTable.columns[0]

      if (!sourceCol || !targetCol) continue

      relationships.push({
        id: generateId(),
        relationType: '1:N',
        sourceColumnId: targetCol.id,
        sourceTableId: targetTable.id,
        targetColumnId: sourceCol.id,
        targetTableId: sourceTable.id,
      })
    }
  }

  return { errors, relationships, tables }
}
