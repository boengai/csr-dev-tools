import type { ColumnType, DiagramSchema } from '@/types'
import type { EntityIdMinters } from '@/diagram/id-minters'
import type { ParseResult } from '@/types/diagram/codecs/import'
import type { JsonSchemaProperty, JsonSchemaRoot } from '@/types/diagram/codecs/json-schema'

import { gridLayoutPositions } from '@/diagram/layout'

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

export function parseJsonSchema(schema: object, minters: EntityIdMinters): ParseResult {
  const root = schema as JsonSchemaRoot
  const definitions = root.definitions ?? root.$defs

  if (!definitions || typeof definitions !== 'object') {
    return { errors: [], relationships: [], tables: [] }
  }

  const rawTables: DiagramSchema['tables'] = []
  const relationships: DiagramSchema['relationships'] = []
  const errors: ParseResult['errors'] = []

  // First pass: build tables with placeholder position
  const tableByDefName = new Map<string, DiagramSchema['tables'][number]>()

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
          id: minters.column(),
          name: propName,
          type: mapJsonType(prop),
        })
      }
    }

    const table: DiagramSchema['tables'][number] = {
      columns,
      id: minters.table(),
      name: defName,
      position: { x: 0, y: 0 },
    }

    rawTables.push(table)
    tableByDefName.set(defName, table)
  }

  // Compute positions from the actual number of tables that passed the filter
  const positions = gridLayoutPositions(rawTables.length)
  const tables: DiagramSchema['tables'] = rawTables.map((t, i) => ({ ...t, position: positions[i] }))

  // Rebuild lookup to point at the final positioned table objects
  for (const t of tables) {
    tableByDefName.set(t.name, t)
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
        id: minters.relation(),
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
