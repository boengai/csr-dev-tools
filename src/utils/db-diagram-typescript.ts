import type { ColumnType, DiagramSchema } from '@/types'

const TS_TYPE_MAP: Record<ColumnType, string> = {
  BIGINT: 'number',
  BLOB: 'Uint8Array',
  BOOLEAN: 'boolean',
  DATE: 'Date',
  DECIMAL: 'number',
  FLOAT: 'number',
  INT: 'number',
  JSON: 'Record<string, unknown>',
  SERIAL: 'number',
  TEXT: 'string',
  TIMESTAMP: 'Date',
  UUID: 'string',
  VARCHAR: 'string',
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}

export function generateTypeScript(schema: DiagramSchema): string {
  if (schema.tables.length === 0) return ''

  const blocks: Array<string> = []

  for (const table of schema.tables) {
    const typeName = toPascalCase(table.name)
    const lines: Array<string> = [`export type ${typeName} = {`]

    for (const col of table.columns) {
      const propName = snakeToCamel(col.name)
      const tsType = TS_TYPE_MAP[col.type]
      const nullable = col.constraints.isNullable ? ` | null` : ''
      lines.push(`  ${propName}: ${tsType}${nullable}`)
    }

    lines.push('}')
    blocks.push(lines.join('\n'))
  }

  return blocks.join('\n\n')
}
