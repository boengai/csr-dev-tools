import type { ColumnType, DiagramSchema, RelationshipType } from '@/types'

import { generateId, gridLayoutPositions } from '@/utils/db-diagram'

import type { ParseResult } from './db-diagram-import'

// ── Generator ──────────────────────────────────────────────────────

const DBML_TYPE_MAP: Record<ColumnType, string> = {
  BIGINT: 'bigint',
  BLOB: 'blob',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DECIMAL: 'decimal',
  FLOAT: 'float',
  INT: 'int',
  JSON: 'json',
  SERIAL: 'serial',
  TEXT: 'text',
  TIMESTAMP: 'timestamp',
  UUID: 'uuid',
  VARCHAR: 'varchar',
}

const REL_SYMBOL: Record<RelationshipType, string> = {
  '1:1': '-',
  '1:N': '<',
  'N:M': '<>',
}

function formatConstraints(col: DiagramSchema['tables'][number]['columns'][number]): string {
  const tags: Array<string> = []
  if (col.constraints.isPrimaryKey) tags.push('pk')
  if (col.constraints.isUnique && !col.constraints.isPrimaryKey) tags.push('unique')
  if (col.constraints.isNullable) tags.push('null')
  if (!col.constraints.isNullable && !col.constraints.isPrimaryKey) tags.push('not null')
  return tags.length > 0 ? ` [${tags.join(', ')}]` : ''
}

export function generateDbml(schema: DiagramSchema): string {
  if (schema.tables.length === 0) return ''

  const blocks: Array<string> = []

  for (const table of schema.tables) {
    const lines: Array<string> = [`Table ${table.name} {`]
    for (const col of table.columns) {
      const typeName = DBML_TYPE_MAP[col.type] ?? col.type.toLowerCase()
      const constraints = formatConstraints(col)
      lines.push(`  ${col.name} ${typeName}${constraints}`)
    }
    lines.push('}')
    blocks.push(lines.join('\n'))
  }

  // Build table/column name lookups by ID
  const tableNameById = new Map<string, string>()
  const columnNameById = new Map<string, Map<string, string>>()
  for (const table of schema.tables) {
    tableNameById.set(table.id, table.name)
    const colMap = new Map<string, string>()
    for (const col of table.columns) {
      colMap.set(col.id, col.name)
    }
    columnNameById.set(table.id, colMap)
  }

  for (const rel of schema.relationships) {
    const sourceTable = tableNameById.get(rel.sourceTableId)
    const targetTable = tableNameById.get(rel.targetTableId)
    const sourceCol = columnNameById.get(rel.sourceTableId)?.get(rel.sourceColumnId)
    const targetCol = columnNameById.get(rel.targetTableId)?.get(rel.targetColumnId)
    if (!sourceTable || !targetTable || !sourceCol || !targetCol) continue

    const symbol = REL_SYMBOL[rel.relationType]
    blocks.push(`Ref: ${sourceTable}.${sourceCol} ${symbol} ${targetTable}.${targetCol}`)
  }

  return blocks.join('\n\n')
}

// ── Parser ─────────────────────────────────────────────────────────

const DBML_TYPE_REVERSE: Record<string, ColumnType> = {
  bigint: 'BIGINT',
  blob: 'BLOB',
  bool: 'BOOLEAN',
  boolean: 'BOOLEAN',
  date: 'DATE',
  decimal: 'DECIMAL',
  float: 'FLOAT',
  int: 'INT',
  integer: 'INT',
  json: 'JSON',
  jsonb: 'JSON',
  serial: 'SERIAL',
  text: 'TEXT',
  timestamp: 'TIMESTAMP',
  uuid: 'UUID',
  varchar: 'VARCHAR',
}

const REL_SYMBOL_REVERSE: Record<string, RelationshipType> = {
  '-': '1:1',
  '<': '1:N',
  '>': '1:N', // reversed direction handled in relationship building
  '<>': 'N:M',
}

type ParsedTable = {
  columns: Array<{
    constraints: { isForeignKey: boolean; isNullable: boolean; isPrimaryKey: boolean; isUnique: boolean }
    id: string
    inlineRef?: { column: string; table: string }
    name: string
    type: ColumnType
  }>
  lineNumber: number
  name: string
}

type ParsedRef = {
  lineNumber: number
  relationType: RelationshipType
  reversed: boolean
  sourceColumn: string
  sourceTable: string
  targetColumn: string
  targetTable: string
}

function parseConstraintBrackets(bracketContent: string): {
  inlineRef?: { column: string; table: string }
  isForeignKey: boolean
  isNullable: boolean
  isPrimaryKey: boolean
  isUnique: boolean
} {
  const result = { isForeignKey: false, isNullable: false, isPrimaryKey: false, isUnique: false }
  let inlineRef: { column: string; table: string } | undefined

  // Split by comma but respect nested brackets
  const parts = bracketContent.split(',').map((s) => s.trim().toLowerCase())

  for (const part of parts) {
    if (part === 'pk' || part === 'primary key') {
      result.isPrimaryKey = true
      result.isNullable = false
    } else if (part === 'unique') {
      result.isUnique = true
    } else if (part === 'null') {
      result.isNullable = true
    } else if (part === 'not null') {
      result.isNullable = false
    } else if (part === 'increment') {
      // Ignored — we infer from SERIAL type
    } else if (part.startsWith('ref:')) {
      // inline ref: ref: > table.column or ref: - table.column
      const refStr = part.slice(4).trim()
      const refMatch = refStr.match(/^([<>\-]+)\s*(\w+)\.(\w+)$/)
      if (refMatch) {
        inlineRef = { column: refMatch[3], table: refMatch[2] }
        result.isForeignKey = true
      }
    }
  }

  return { ...result, inlineRef }
}

function parseColumnLine(
  line: string,
  lineNumber: number,
  errors: Array<{ line: number; message: string }>,
): ParsedTable['columns'][number] | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed === '{' || trimmed === '}') return null

  // Extract bracket constraints if present
  let mainPart = trimmed
  let bracketContent = ''
  const bracketMatch = trimmed.match(/^(.+?)\s*\[([^\]]*)\]\s*$/)
  if (bracketMatch) {
    mainPart = bracketMatch[1].trim()
    bracketContent = bracketMatch[2]
  }

  // Split main part into name and type
  const tokens = mainPart.split(/\s+/)
  if (tokens.length < 2) {
    errors.push({ line: lineNumber, message: `Invalid column definition: "${trimmed}"` })
    return null
  }

  const name = tokens[0]
  const rawType = tokens[1].toLowerCase()
  const mappedType = DBML_TYPE_REVERSE[rawType]

  if (!mappedType) {
    errors.push({ line: lineNumber, message: `Unknown type "${tokens[1]}" for column "${name}"` })
    return null
  }

  const constraints = bracketContent
    ? parseConstraintBrackets(bracketContent)
    : { isForeignKey: false, isNullable: true, isPrimaryKey: false, isUnique: false }

  return {
    constraints: {
      isForeignKey: constraints.isForeignKey,
      isNullable: constraints.isNullable,
      isPrimaryKey: constraints.isPrimaryKey,
      isUnique: constraints.isUnique,
    },
    id: generateId(),
    inlineRef: constraints.inlineRef,
    name,
    type: mappedType,
  }
}

function parseRefLine(
  line: string,
  lineNumber: number,
): ParsedRef | null {
  // Ref: table1.col < table2.col
  // Ref: table1.col > table2.col
  // Ref: table1.col - table2.col
  // Ref: table1.col <> table2.col
  const trimmed = line.trim()
  const refMatch = trimmed.match(/^Ref\s*:\s*(\w+)\.(\w+)\s*(<>|[<>\-])\s*(\w+)\.(\w+)\s*$/i)
  if (!refMatch) return null

  const symbol = refMatch[3]
  const relationType = REL_SYMBOL_REVERSE[symbol]
  if (!relationType) return null

  // If `>` is used, the direction is reversed: source is right side, target is left side
  const reversed = symbol === '>'

  return {
    lineNumber,
    relationType,
    reversed,
    sourceColumn: reversed ? refMatch[5] : refMatch[2],
    sourceTable: reversed ? refMatch[4] : refMatch[1],
    targetColumn: reversed ? refMatch[2] : refMatch[5],
    targetTable: reversed ? refMatch[1] : refMatch[4],
  }
}

export function parseDbml(text: string): ParseResult {
  if (!text.trim()) {
    return { errors: [], relationships: [], tables: [] }
  }

  const lines = text.split('\n')
  const parsedTables: Array<ParsedTable> = []
  const parsedRefs: Array<ParsedRef> = []
  const errors: Array<{ line: number; message: string }> = []

  let currentTable: ParsedTable | null = null
  let braceDepth = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const lineNumber = i + 1

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('--')) continue

    // Table block start
    const tableMatch = trimmed.match(/^Table\s+(\w+)\s*\{?\s*$/i)
    if (tableMatch) {
      currentTable = { columns: [], lineNumber, name: tableMatch[1] }
      braceDepth = trimmed.includes('{') ? 1 : 0
      continue
    }

    // Opening brace on its own line (after Table declaration without brace)
    if (trimmed === '{' && currentTable && braceDepth === 0) {
      braceDepth = 1
      continue
    }

    // Closing brace
    if (trimmed === '}' && currentTable && braceDepth === 1) {
      parsedTables.push(currentTable)
      currentTable = null
      braceDepth = 0
      continue
    }

    // Inside a table block
    if (currentTable && braceDepth === 1) {
      const col = parseColumnLine(trimmed, lineNumber, errors)
      if (col) currentTable.columns.push(col)
      continue
    }

    // Standalone Ref line
    if (/^Ref\s*:/i.test(trimmed)) {
      const ref = parseRefLine(trimmed, lineNumber)
      if (ref) {
        parsedRefs.push(ref)
      } else {
        errors.push({ line: lineNumber, message: `Invalid Ref syntax: "${trimmed}"` })
      }
      continue
    }

    // Unknown line outside blocks
    if (!currentTable) {
      errors.push({ line: lineNumber, message: `Unexpected: "${trimmed}"` })
    }
  }

  // Unclosed table block
  if (currentTable) {
    errors.push({ line: currentTable.lineNumber, message: `Unclosed Table block: "${currentTable.name}"` })
    parsedTables.push(currentTable)
    currentTable = null
  }

  // Build DiagramSchema tables with positions
  const positions = gridLayoutPositions(parsedTables.length)
  const tables: DiagramSchema['tables'] = parsedTables.map((t, idx) => ({
    columns: t.columns.map((c) => ({
      constraints: { ...c.constraints },
      id: c.id,
      name: c.name,
      type: c.type,
    })),
    id: generateId(),
    name: t.name,
    position: positions[idx] ?? { x: 0, y: 0 },
  }))

  // Build lookup maps for relationships
  const tableByName = new Map<string, DiagramSchema['tables'][number]>()
  for (const t of tables) {
    tableByName.set(t.name.toLowerCase(), t)
  }

  const relationships: DiagramSchema['relationships'] = []

  // Process standalone Ref lines
  for (const ref of parsedRefs) {
    const sourceT = tableByName.get(ref.sourceTable.toLowerCase())
    const targetT = tableByName.get(ref.targetTable.toLowerCase())
    if (!sourceT || !targetT) {
      errors.push({ line: ref.lineNumber, message: `Ref references unknown table` })
      continue
    }

    const sourceCol = sourceT.columns.find((c) => c.name.toLowerCase() === ref.sourceColumn.toLowerCase())
    const targetCol = targetT.columns.find((c) => c.name.toLowerCase() === ref.targetColumn.toLowerCase())
    if (!sourceCol || !targetCol) {
      errors.push({ line: ref.lineNumber, message: `Ref references unknown column` })
      continue
    }

    relationships.push({
      id: generateId(),
      relationType: ref.relationType,
      sourceColumnId: sourceCol.id,
      sourceTableId: sourceT.id,
      targetColumnId: targetCol.id,
      targetTableId: targetT.id,
    })
  }

  // Process inline refs from columns
  for (let tIdx = 0; tIdx < parsedTables.length; tIdx++) {
    const parsed = parsedTables[tIdx]
    const layouted = tables[tIdx]

    for (let cIdx = 0; cIdx < parsed.columns.length; cIdx++) {
      const parsedCol = parsed.columns[cIdx]
      if (!parsedCol.inlineRef) continue

      const refTable = tableByName.get(parsedCol.inlineRef.table.toLowerCase())
      if (!refTable) continue

      const refCol = refTable.columns.find(
        (c) => c.name.toLowerCase() === parsedCol.inlineRef!.column.toLowerCase(),
      )
      if (!refCol) continue

      const sourceCol = layouted.columns[cIdx]

      relationships.push({
        id: generateId(),
        relationType: '1:N',
        sourceColumnId: refCol.id,
        sourceTableId: refTable.id,
        targetColumnId: sourceCol.id,
        targetTableId: layouted.id,
      })
    }
  }

  return { errors, relationships, tables }
}
