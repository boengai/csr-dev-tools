import type { DiagramDocument, ImportResult, SqlDialect } from '@/types'
import { parseJsonSchema } from '@/utils/db-diagram-json-schema'
import { parseSqlDdl } from '@/utils/db-diagram-import'
import { schemaToDocument } from './lifecycle'

export const importFromSql = (
  doc: DiagramDocument,
  text: string,
  dialect: SqlDialect,
): { document: DiagramDocument; result: ImportResult } => {
  const parsed = parseSqlDdl(text, dialect)
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
): { document: DiagramDocument; result: ImportResult } => {
  try {
    const schema = JSON.parse(text) as unknown
    const parsed = parseJsonSchema(schema as object)
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
