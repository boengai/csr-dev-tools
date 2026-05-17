import type { DiagramDocument, ImportResult, SqlDialect } from '@/types'
import type { EntityIdMinters } from '@/diagram/id-minters'

import { parseSqlDdl } from '@/diagram/codecs/import'
import { parseJsonSchema } from '@/diagram/codecs/json-schema'

import { schemaToDocument } from './lifecycle'

export const importFromSql = (
  doc: DiagramDocument,
  text: string,
  dialect: SqlDialect,
  minters: EntityIdMinters,
): { document: DiagramDocument; result: ImportResult } => {
  const parsed = parseSqlDdl(text, dialect, minters)
  if (parsed.tables.length === 0) {
    return {
      document: doc,
      result: { tableCount: 0, errors: parsed.errors },
    }
  }
  return {
    document: schemaToDocument({ tables: parsed.tables, relationships: parsed.relationships }, doc),
    result: { tableCount: parsed.tables.length, errors: parsed.errors },
  }
}

export const importFromJsonSchema = (
  doc: DiagramDocument,
  text: string,
  minters: EntityIdMinters,
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
    return {
      document: schemaToDocument({ tables: parsed.tables, relationships: parsed.relationships }, doc),
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
