import type { DiagramDocument, DiagramSchema, SqlDialect } from '@/types'
import { generateDbml } from '@/utils/db-diagram-dbml'
import { generateMermaidER } from '@/utils/db-diagram-mermaid'
import { generateSql } from '@/utils/db-diagram-sql'
import { generateTypeScript } from '@/utils/db-diagram-typescript'

export const documentToSchema = (doc: DiagramDocument): DiagramSchema => ({
  tables: doc.tableOrder
    .map((id) => doc.tables[id])
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({ id: t.id, name: t.name, columns: t.columns, position: t.position })),
  relationships: doc.relationOrder
    .map((id) => doc.relations[id])
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({
      id: r.id,
      relationType: r.kind,
      sourceColumnId: r.source.columnId,
      sourceTableId: r.source.tableId,
      targetColumnId: r.target.columnId,
      targetTableId: r.target.tableId,
    })),
})

export const toDbml = (doc: DiagramDocument): string => generateDbml(documentToSchema(doc))
export const toSql = (doc: DiagramDocument, dialect: SqlDialect): string =>
  generateSql(documentToSchema(doc), dialect)
export const toMermaid = (doc: DiagramDocument): string => generateMermaidER(documentToSchema(doc))
export const toTypeScript = (doc: DiagramDocument): string => generateTypeScript(documentToSchema(doc))
export const toJsonSchema = (doc: DiagramDocument): string => generateJsonSchema(documentToSchema(doc))

// Generate JSON Schema from DiagramSchema
export function generateJsonSchema(schema: DiagramSchema): string {
  if (schema.tables.length === 0) return '{}'

  const definitions: Record<string, { properties: Record<string, unknown>; required: Array<string> }> = {}

  // Map ColumnType to JSON Schema types
  const typeMap: Record<string, string> = {
    BIGINT: 'integer',
    BLOB: 'string',
    BOOLEAN: 'boolean',
    DATE: 'string',
    DECIMAL: 'number',
    FLOAT: 'number',
    INT: 'integer',
    JSON: 'object',
    SERIAL: 'integer',
    TEXT: 'string',
    TIMESTAMP: 'string',
    UUID: 'string',
    VARCHAR: 'string',
  }

  // First pass: create table definitions
  const tableIds = new Map<string, string>()
  for (const table of schema.tables) {
    tableIds.set(table.id, table.name)
    const properties: Record<string, unknown> = {}
    const required: Array<string> = []

    for (const col of table.columns) {
      const jsonType = typeMap[col.type] ?? 'string'
      properties[col.name] = { type: jsonType }

      if (!col.constraints.isNullable && !col.constraints.isPrimaryKey) {
        required.push(col.name)
      }
    }

    definitions[table.name] = { properties, required }
  }

  // Second pass: add $ref for foreign keys
  for (const table of schema.tables) {
    const def = definitions[table.name]
    if (!def) continue

    for (const rel of schema.relationships) {
      if (rel.relationType === 'N:M') continue
      if (rel.targetTableId !== table.id) continue

      const sourceTable = tableIds.get(rel.sourceTableId)
      const targetCol = table.columns.find((c) => c.id === rel.targetColumnId)
      if (!sourceTable || !targetCol) continue

      // Replace the property with a $ref
      ;(def.properties[targetCol.name] as Record<string, unknown>) = {
        $ref: `#/$defs/${sourceTable}`,
      }

      // Add to required if not nullable
      const col = table.columns.find((c) => c.id === rel.targetColumnId)
      if (col && !col.constraints.isNullable && !def.required.includes(targetCol.name)) {
        def.required.push(targetCol.name)
      }
    }
  }

  const root = { $defs: definitions }
  return JSON.stringify(root, null, 2)
}
