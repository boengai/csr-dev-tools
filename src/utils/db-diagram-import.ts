import type { ColumnType, DiagramSchema, SqlDialect } from '@/types'

import { generateId } from '@/utils/db-diagram'

export type ParseResult = {
  errors: Array<{ line: number; message: string }>
  relationships: DiagramSchema['relationships']
  tables: DiagramSchema['tables']
}

type ParsedColumn = {
  constraints: {
    isForeignKey: boolean
    isNullable: boolean
    isPrimaryKey: boolean
    isUnique: boolean
  }
  id: string
  name: string
  type: ColumnType
}

type FkRef = {
  referencedColumn: string
  referencedTable: string
  sourceColumn: string
}

const SQL_TYPE_MAP: Array<{ match: RegExp; type: ColumnType }> = [
  { match: /^BIGSERIAL$/i, type: 'BIGINT' },
  { match: /^SERIAL$/i, type: 'SERIAL' },
  { match: /^BIGINT/i, type: 'BIGINT' },
  { match: /^TINYINT\s*\(\s*1\s*\)/i, type: 'BOOLEAN' },
  { match: /^(INT|INTEGER)/i, type: 'INT' },
  { match: /^(BOOLEAN|BOOL)$/i, type: 'BOOLEAN' },
  { match: /^UUID$/i, type: 'UUID' },
  { match: /^CHAR\s*\(\s*36\s*\)$/i, type: 'UUID' },
  { match: /^(VARCHAR|CHAR)\s*(\(.*\))?$/i, type: 'VARCHAR' },
  { match: /^(TINYTEXT|MEDIUMTEXT|LONGTEXT|TEXT)/i, type: 'TEXT' },
  { match: /^DATE$/i, type: 'DATE' },
  { match: /^(TIMESTAMP|DATETIME)/i, type: 'TIMESTAMP' },
  { match: /^(FLOAT|REAL|DOUBLE)/i, type: 'FLOAT' },
  { match: /^(DECIMAL|NUMERIC)/i, type: 'DECIMAL' },
  { match: /^JSONB?$/i, type: 'JSON' },
  { match: /^(BLOB|BYTEA|BINARY|VARBINARY)/i, type: 'BLOB' },
]

function mapSqlType(rawType: string): ColumnType {
  const trimmed = rawType.trim()
  for (const entry of SQL_TYPE_MAP) {
    if (entry.match.test(trimmed)) return entry.type
  }
  return 'TEXT'
}

function stripComments(sql: string): string {
  // Strip block comments
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, '')
  // Strip line comments (but not inside strings — simplified: just match lines)
  result = result.replace(/--[^\n]*/g, '')
  return result
}

function unquoteName(name: string): string {
  const trimmed = name.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('`') && trimmed.endsWith('`')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function extractType(tokens: Array<string>): { consumed: number; rawType: string } {
  if (tokens.length === 0) return { consumed: 0, rawType: '' }

  let rawType = tokens[0]
  let consumed = 1

  // Handle types with parenthesized parameters like VARCHAR(255), DECIMAL(10,2), TINYINT(1)
  if (consumed < tokens.length && tokens[consumed].startsWith('(')) {
    // It may be split across tokens like ['VARCHAR', '(255)'] or ['DECIMAL', '(10,', '2)']
    let parenPart = ''
    while (consumed < tokens.length) {
      parenPart += tokens[consumed]
      consumed++
      if (parenPart.includes(')')) break
    }
    rawType += parenPart
  } else if (rawType.includes('(')) {
    // Type already includes parenthesis like 'VARCHAR(255)'
    // nothing to do
  }

  return { consumed, rawType }
}

function splitColumnDefs(body: string): Array<string> {
  // Split by commas but respect parentheses
  const parts: Array<string> = []
  let depth = 0
  let current = ''

  for (const char of body) {
    if (char === '(') depth++
    else if (char === ')') depth--

    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())

  return parts
}

function parseColumnDef(def: string): {
  column: ParsedColumn | null
  fkRef: FkRef | null
  isPkConstraint: string | null
  isUniqueConstraint: string | null
} {
  const trimmed = def.trim()
  const upper = trimmed.toUpperCase()

  // Table-level PRIMARY KEY (col)
  const pkMatch = upper.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/)
  if (pkMatch) {
    return { column: null, fkRef: null, isPkConstraint: unquoteName(pkMatch[1]), isUniqueConstraint: null }
  }

  // Table-level FOREIGN KEY (col) REFERENCES table(col)
  const fkMatch = trimmed.match(/^FOREIGN\s+KEY\s*\(\s*([^)]+)\s*\)\s*REFERENCES\s+([^\s(]+)\s*\(\s*([^)]+)\s*\)/i)
  if (fkMatch) {
    return {
      column: null,
      fkRef: {
        referencedColumn: unquoteName(fkMatch[3]),
        referencedTable: unquoteName(fkMatch[2]),
        sourceColumn: unquoteName(fkMatch[1]),
      },
      isPkConstraint: null,
      isUniqueConstraint: null,
    }
  }

  // Table-level UNIQUE (col)
  const uniqueMatch = upper.match(/^UNIQUE\s*\(([^)]+)\)/)
  if (uniqueMatch) {
    return { column: null, fkRef: null, isPkConstraint: null, isUniqueConstraint: unquoteName(uniqueMatch[1]) }
  }

  // Skip CONSTRAINT keyword prefix
  if (upper.startsWith('CONSTRAINT')) {
    // CONSTRAINT name PRIMARY KEY / FOREIGN KEY / UNIQUE
    const afterConstraint = trimmed.replace(/^CONSTRAINT\s+\S+\s+/i, '')
    return parseColumnDef(afterConstraint)
  }

  // Column definition: name TYPE [constraints...]
  const tokens = trimmed.split(/\s+/)
  if (tokens.length < 2) return { column: null, fkRef: null, isPkConstraint: null, isUniqueConstraint: null }

  const name = unquoteName(tokens[0])

  // Skip table options like ENGINE=InnoDB
  if (name.toUpperCase().startsWith('ENGINE') || name.toUpperCase().startsWith('DEFAULT')) {
    return { column: null, fkRef: null, isPkConstraint: null, isUniqueConstraint: null }
  }

  const { consumed, rawType } = extractType(tokens.slice(1))
  const mappedType = mapSqlType(rawType)
  const restTokens = tokens.slice(1 + consumed)
  const rest = restTokens.join(' ').toUpperCase()

  const isPrimaryKey = rest.includes('PRIMARY KEY') || rest.includes('PRIMARY')
  const isUnique = rest.includes('UNIQUE') || isPrimaryKey
  const isNotNull = rest.includes('NOT NULL') || isPrimaryKey
  const isAutoIncrement = rest.includes('AUTO_INCREMENT') || rest.includes('AUTOINCREMENT')

  // Inline REFERENCES
  let inlineFkRef: FkRef | null = null
  const refMatch = trimmed.match(/REFERENCES\s+([^\s(]+)\s*\(\s*([^)]+)\s*\)/i)
  if (refMatch) {
    inlineFkRef = {
      referencedColumn: unquoteName(refMatch[2]),
      referencedTable: unquoteName(refMatch[1]),
      sourceColumn: name,
    }
  }

  const column: ParsedColumn = {
    constraints: {
      isForeignKey: inlineFkRef !== null,
      isNullable: !isNotNull,
      isPrimaryKey,
      isUnique,
    },
    id: generateId(),
    name,
    type: isAutoIncrement && mappedType === 'INT' ? 'INT' : mappedType,
  }

  return { column, fkRef: inlineFkRef, isPkConstraint: null, isUniqueConstraint: null }
}

function parseCreateTable(statement: string): {
  columns: Array<ParsedColumn>
  fkRefs: Array<FkRef>
  tableName: string
} | null {
  // Extract table name
  const tableMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(/i)
  if (!tableMatch) return null

  const tableName = tableMatch[1]

  // Extract body between first ( and last )
  const firstParen = statement.indexOf('(')
  const lastParen = statement.lastIndexOf(')')
  if (firstParen === -1 || lastParen === -1 || lastParen <= firstParen) return null

  const body = statement.slice(firstParen + 1, lastParen)
  const defs = splitColumnDefs(body)

  const columns: Array<ParsedColumn> = []
  const fkRefs: Array<FkRef> = []
  const pkColumns: Array<string> = []
  const uniqueColumns: Array<string> = []

  for (const def of defs) {
    const parsed = parseColumnDef(def)

    if (parsed.column) {
      columns.push(parsed.column)
    }
    if (parsed.fkRef) {
      fkRefs.push(parsed.fkRef)
    }
    if (parsed.isPkConstraint) {
      pkColumns.push(parsed.isPkConstraint)
    }
    if (parsed.isUniqueConstraint) {
      uniqueColumns.push(parsed.isUniqueConstraint)
    }
  }

  // Apply table-level PK constraint to columns
  for (const pkName of pkColumns) {
    const col = columns.find((c) => c.name.toLowerCase() === pkName.toLowerCase())
    if (col) {
      col.constraints.isPrimaryKey = true
      col.constraints.isNullable = false
      col.constraints.isUnique = true
    }
  }

  // Apply table-level UNIQUE constraint to columns
  for (const uName of uniqueColumns) {
    const col = columns.find((c) => c.name.toLowerCase() === uName.toLowerCase())
    if (col) {
      col.constraints.isUnique = true
    }
  }

  return { columns, fkRefs, tableName }
}

function layoutTables(
  tables: Array<{ columns: Array<ParsedColumn>; fkRefs: Array<FkRef>; tableName: string }>,
): Array<DiagramSchema['tables'][number]> {
  const GRID_COLS = 3
  const H_SPACING = 300
  const V_SPACING = 250

  return tables.map((t, index) => ({
    columns: t.columns.map((c) => ({
      constraints: { ...c.constraints },
      id: c.id,
      name: c.name,
      type: c.type,
    })),
    id: generateId(),
    name: t.tableName,
    position: {
      x: (index % GRID_COLS) * H_SPACING,
      y: Math.floor(index / GRID_COLS) * V_SPACING,
    },
  }))
}

function buildRelationships(
  parsedTables: Array<{ columns: Array<ParsedColumn>; fkRefs: Array<FkRef>; tableName: string }>,
  layoutedTables: DiagramSchema['tables'],
): DiagramSchema['relationships'] {
  const relationships: DiagramSchema['relationships'] = []

  // Build lookup maps
  const tableByName = new Map<string, DiagramSchema['tables'][number]>()
  for (const lt of layoutedTables) {
    tableByName.set(lt.name.toLowerCase(), lt)
  }

  for (let i = 0; i < parsedTables.length; i++) {
    const parsed = parsedTables[i]
    const sourceLayouted = layoutedTables[i] // Same index

    for (const fkRef of parsed.fkRefs) {
      const referencedTable = tableByName.get(fkRef.referencedTable.toLowerCase())
      if (!referencedTable) continue

      const referencedCol = referencedTable.columns.find(
        (c) => c.name.toLowerCase() === fkRef.referencedColumn.toLowerCase(),
      )
      const sourceCol = sourceLayouted.columns.find((c) => c.name.toLowerCase() === fkRef.sourceColumn.toLowerCase())
      if (!referencedCol || !sourceCol) continue

      // Mark the FK column
      sourceCol.constraints.isForeignKey = true

      // Determine cardinality: if FK column has UNIQUE, it's 1:1
      const relationType = sourceCol.constraints.isUnique ? '1:1' : '1:N'

      relationships.push({
        id: generateId(),
        relationType,
        sourceColumnId: referencedCol.id,
        sourceTableId: referencedTable.id,
        targetColumnId: sourceCol.id,
        targetTableId: sourceLayouted.id,
      })
    }
  }

  return relationships
}

export function parseSqlDdl(sql: string, dialect: SqlDialect): ParseResult {
  if (!sql.trim()) {
    return { errors: [], relationships: [], tables: [] }
  }

  const cleaned = stripComments(sql)
  const statements = cleaned
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  const parsedTables: Array<{ columns: Array<ParsedColumn>; fkRefs: Array<FkRef>; tableName: string }> = []
  const errors: ParseResult['errors'] = []

  for (const stmt of statements) {
    if (/CREATE\s+TABLE/i.test(stmt)) {
      const result = parseCreateTable(stmt)
      if (result) {
        parsedTables.push(result)
      } else {
        // Count approximate line number
        const idx = cleaned.indexOf(stmt)
        const line = (cleaned.slice(0, idx).match(/\n/g) ?? []).length + 1
        errors.push({ line, message: `[${dialect}] Failed to parse CREATE TABLE statement near line ${line}` })
      }
    } else if (stmt.length > 0 && !/^\s*$/.test(stmt)) {
      // Non-CREATE TABLE, non-empty statement → possible error
      const idx = cleaned.indexOf(stmt)
      const line = (cleaned.slice(0, idx).match(/\n/g) ?? []).length + 1
      errors.push({ line, message: `[${dialect}] Unsupported statement near line ${line}: ${stmt.slice(0, 60)}...` })
    }
  }

  const tables = layoutTables(parsedTables)
  const relationships = buildRelationships(parsedTables, tables)

  return { errors, relationships, tables }
}
