import type { DiagramSchema, RelationshipType } from '@/types'

const RELATION_MAP: Record<RelationshipType, string> = {
  '1:1': '||--||',
  '1:N': '||--o{',
  'N:M': '}o--o{',
}

function columnMarker(col: DiagramSchema['tables'][number]['columns'][number]): string {
  if (col.constraints.isPrimaryKey) return ' PK'
  if (col.constraints.isForeignKey) return ' FK'
  return ''
}

export function generateMermaidER(schema: DiagramSchema): string {
  if (schema.tables.length === 0) return ''

  const lines: Array<string> = ['erDiagram']

  for (const table of schema.tables) {
    const safeName = table.name.replace(/\s+/g, '_').toUpperCase()
    lines.push(`  ${safeName} {`)
    for (const col of table.columns) {
      const typeName = col.type.toLowerCase()
      const marker = columnMarker(col)
      lines.push(`    ${typeName} ${col.name}${marker}`)
    }
    lines.push('  }')
  }

  // Build table name lookup by ID
  const tableNameById = new Map<string, string>()
  for (const table of schema.tables) {
    tableNameById.set(table.id, table.name.replace(/\s+/g, '_').toUpperCase())
  }

  for (const rel of schema.relationships) {
    const sourceName = tableNameById.get(rel.sourceTableId)
    const targetName = tableNameById.get(rel.targetTableId)
    if (!sourceName || !targetName) continue

    const notation = RELATION_MAP[rel.relationType]
    lines.push(`  ${sourceName} ${notation} ${targetName} : "has"`)
  }

  return lines.join('\n')
}
