import { generateDbml, parseDbml } from '@/diagram/codecs/dbml'
import type { EntityIdMinters } from '@/diagram/id-minters'
import type { DiagramDocument, ImportResult } from '@/types'

import { documentToSchema } from './export'
import { schemaToDocument } from './lifecycle'

export const setDbmlText = (doc: DiagramDocument, text: string): DiagramDocument => ({
  ...doc,
  dbmlText: text,
  dbmlSource: 'editor',
})

export const regenerateDbmlFromDocument = (doc: DiagramDocument): DiagramDocument => {
  const hasTables = doc.tableOrder.length > 0
  return {
    ...doc,
    dbmlText: hasTables ? generateDbml(documentToSchema(doc)) : '',
    dbmlSource: 'diagram',
    dbmlErrors: [],
  }
}

export const applyDbmlNow = (
  doc: DiagramDocument,
  minters: EntityIdMinters,
): { document: DiagramDocument; result: ImportResult } => {
  const parsed = parseDbml(doc.dbmlText, minters)

  if (parsed.tables.length === 0) {
    return {
      document: { ...doc, dbmlErrors: parsed.errors },
      result: { tableCount: 0, errors: parsed.errors },
    }
  }

  const replaced = schemaToDocument({ tables: parsed.tables, relationships: parsed.relationships }, doc)
  return {
    document: {
      ...replaced,
      dbmlText: doc.dbmlText,
      dbmlSource: 'editor',
      dbmlErrors: parsed.errors,
    },
    result: { tableCount: parsed.tables.length, errors: parsed.errors },
  }
}
