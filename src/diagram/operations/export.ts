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
export const toSql = (doc: DiagramDocument, dialect: SqlDialect): string => generateSql(documentToSchema(doc), dialect)
export const toMermaid = (doc: DiagramDocument): string => generateMermaidER(documentToSchema(doc))
export const toTypeScript = (doc: DiagramDocument): string => generateTypeScript(documentToSchema(doc))
