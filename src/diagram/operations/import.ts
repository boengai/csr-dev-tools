import { parseJsonSchema } from '@/diagram/codecs/json-schema'
import { parseSqlDdl } from '@/diagram/codecs/sql'
import type { EntityIdMinters } from '@/diagram/id-minters'
import type { DiagramDocument, ImportResult, SqlDialect } from '@/types'

import { mergeSchemaIntoDocument, schemaToDocument } from './lifecycle'

export const importFromSql = (
  doc: DiagramDocument,
  text: string,
  dialect: SqlDialect,
  minters: EntityIdMinters,
  opts?: { merge?: boolean },
): { document: DiagramDocument; result: ImportResult } => {
  const parsed = parseSqlDdl(text, dialect, minters)
  if (parsed.tables.length === 0) {
    return {
      document: doc,
      result: { tableCount: 0, errors: parsed.errors },
    }
  }
  const schema = { tables: parsed.tables, relationships: parsed.relationships }
  return {
    document: opts?.merge ? mergeSchemaIntoDocument(schema, doc) : schemaToDocument(schema, doc),
    result: { tableCount: parsed.tables.length, errors: parsed.errors },
  }
}

export const importFromJsonSchema = (
  doc: DiagramDocument,
  text: string,
  minters: EntityIdMinters,
  opts?: { merge?: boolean },
): { document: DiagramDocument; result: ImportResult } => {
  try {
    const schema = JSON.parse(text) as unknown
    const parsed = parseJsonSchema(schema as object, minters)
    if (parsed.tables.length === 0) {
      return {
        document: doc,
        result: { tableCount: 0, errors: parsed.errors },
      }
    }
    const merged = { tables: parsed.tables, relationships: parsed.relationships }
    return {
      document: opts?.merge ? mergeSchemaIntoDocument(merged, doc) : schemaToDocument(merged, doc),
      result: { tableCount: parsed.tables.length, errors: parsed.errors },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON'
    return {
      document: doc,
      result: { tableCount: 0, errors: [{ line: 0, message: `Invalid JSON: ${message}` }] },
    }
  }
}
