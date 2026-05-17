import type { ColumnType, DiagramSchema, SqlDialect } from '@/types'
import type { EntityIdMinters } from '@/diagram/id-minters'
import type { FkRef, ParseResult, ParsedColumn } from '@/types/diagram/codecs/import'

import { gridLayoutPositions } from '@/diagram/layout'

const TYPE_MAP: Record<ColumnType, Record<SqlDialect, string>> = {
  BIGINT: { mysql: 'BIGINT', postgresql: 'BIGINT', sqlite: 'INTEGER' },
  BLOB: { mysql: 'BLOB', postgresql: 'BYTEA', sqlite: 'BLOB' },
  BOOLEAN: { mysql: 'TINYINT(1)', postgresql: 'BOOLEAN', sqlite: 'INTEGER' },
  DATE: { mysql: 'DATE', postgresql: 'DATE', sqlite: 'TEXT' },
  DECIMAL: { mysql: 'DECIMAL(10,2)', postgresql: 'DECIMAL(10,2)', sqlite: 'REAL' },
  FLOAT: { mysql: 'FLOAT', postgresql: 'REAL', sqlite: 'REAL' },
  INT: { mysql: 'INT', postgresql: 'INTEGER', sqlite: 'INTEGER' },
  JSON: { mysql: 'JSON', postgresql: 'JSONB', sqlite: 'TEXT' },
  SERIAL: { mysql: 'INT', postgresql: 'SERIAL', sqlite: 'INTEGER' },
  TEXT: { mysql: 'TEXT', postgresql: 'TEXT', sqlite: 'TEXT' },
  TIMESTAMP: { mysql: 'TIMESTAMP', postgresql: 'TIMESTAMP', sqlite: 'TEXT' },
  UUID: { mysql: 'CHAR(36)', postgresql: 'UUID', sqlite: 'TEXT' },
  VARCHAR: { mysql: 'VARCHAR(255)', postgresql: 'VARCHAR(255)', sqlite: 'TEXT' },
}

export function mapColumnType(type: ColumnType, dialect: SqlDialect): string {
  return TYPE_MAP[type][dialect]
}

export function generateCreateTable(table: DiagramSchema['tables'][0], dialect: SqlDialect): string {
  if (table.columns.length === 0) {
    if (dialect === 'mysql') {
      return `CREATE TABLE ${table.name} (\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    }
    return `CREATE TABLE ${table.name} (\n);`
  }

  const lines: Array<string> = []
  const pkColumns: Array<string> = []

  for (const col of table.columns) {
    const parts: Array<string> = []
    const isSerialPk = col.type === 'SERIAL' && col.constraints.isPrimaryKey

    if (dialect === 'sqlite' && isSerialPk) {
      parts.push(`  ${col.name} INTEGER PRIMARY KEY AUTOINCREMENT`)
    } else if (dialect === 'mysql' && isSerialPk) {
      parts.push(`  ${col.name} ${mapColumnType(col.type, dialect)}`)
      if (!col.constraints.isNullable) parts.push('NOT NULL')
      parts.push('AUTO_INCREMENT')
      pkColumns.push(col.name)
    } else {
      parts.push(`  ${col.name} ${mapColumnType(col.type, dialect)}`)

      if (col.constraints.isPrimaryKey && dialect === 'postgresql') {
        parts.push('PRIMARY KEY')
      } else if (col.constraints.isPrimaryKey) {
        pkColumns.push(col.name)
      }

      if (!col.constraints.isNullable && !(dialect === 'sqlite' && isSerialPk)) {
        parts.push('NOT NULL')
      }

      if (col.constraints.isUnique && !col.constraints.isPrimaryKey) {
        parts.push('UNIQUE')
      }
    }

    lines.push(parts.join(' '))
  }

  if (dialect !== 'postgresql' && pkColumns.length > 0) {
    lines.push(`  PRIMARY KEY (${pkColumns.join(', ')})`)
  }

  const suffix = dialect === 'mysql' ? ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;' : ');'
  return `CREATE TABLE ${table.name} (\n${lines.join(',\n')}\n${suffix}`
}

export function generateForeignKeys(
  relationships: DiagramSchema['relationships'],
  tables: DiagramSchema['tables'],
  dialect: SqlDialect,
): string {
  const tableMap = new Map(tables.map((t) => [t.id, t]))
  const alterStatements: Array<string> = []

  for (const rel of relationships) {
    if (rel.relationType === 'N:M') continue

    const sourceTable = tableMap.get(rel.sourceTableId)
    const targetTable = tableMap.get(rel.targetTableId)
    if (!sourceTable || !targetTable) continue

    const sourceCol = sourceTable.columns.find((c) => c.id === rel.sourceColumnId)
    const targetCol = targetTable.columns.find((c) => c.id === rel.targetColumnId)
    if (!sourceCol || !targetCol) continue

    if (dialect === 'sqlite') {
      // SQLite FKs are inline in CREATE TABLE — handled separately
      continue
    }

    alterStatements.push(
      `ALTER TABLE ${targetTable.name} ADD CONSTRAINT fk_${targetTable.name}_${targetCol.name}\n  FOREIGN KEY (${targetCol.name}) REFERENCES ${sourceTable.name}(${sourceCol.name});`,
    )
  }

  return alterStatements.join('\n\n')
}

function topologicalSort(
  tables: DiagramSchema['tables'],
  relationships: DiagramSchema['relationships'],
): Array<DiagramSchema['tables'][0]> {
  const tableMap = new Map(tables.map((t) => [t.id, t]))
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, Array<string>>()

  for (const t of tables) {
    inDegree.set(t.id, 0)
    adjacency.set(t.id, [])
  }

  for (const rel of relationships) {
    if (rel.relationType === 'N:M') continue
    // Source table must come before target table
    const deps = adjacency.get(rel.sourceTableId)
    if (deps) deps.push(rel.targetTableId)
    inDegree.set(rel.targetTableId, (inDegree.get(rel.targetTableId) ?? 0) + 1)
  }

  const queue: Array<string> = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const sorted: Array<DiagramSchema['tables'][0]> = []
  while (queue.length > 0) {
    const current = queue.shift()!
    const table = tableMap.get(current)
    if (table) sorted.push(table)

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  // Add any remaining tables not in the graph (cycle protection)
  for (const t of tables) {
    if (!sorted.find((s) => s.id === t.id)) sorted.push(t)
  }

  return sorted
}

function generateJunctionTable(
  rel: DiagramSchema['relationships'][0],
  tables: DiagramSchema['tables'],
  dialect: SqlDialect,
): string {
  const tableMap = new Map(tables.map((t) => [t.id, t]))
  const sourceTable = tableMap.get(rel.sourceTableId)
  const targetTable = tableMap.get(rel.targetTableId)
  if (!sourceTable || !targetTable) return ''

  const sourceCol = sourceTable.columns.find((c) => c.id === rel.sourceColumnId)
  const targetCol = targetTable.columns.find((c) => c.id === rel.targetColumnId)
  if (!sourceCol || !targetCol) return ''

  const junctionName = `${sourceTable.name}_${targetTable.name}`
  const srcFkName = `${sourceTable.name}_id`
  const tgtFkName = `${targetTable.name}_id`
  const srcType = mapColumnType(sourceCol.type === 'SERIAL' ? 'INT' : sourceCol.type, dialect)
  const tgtType = mapColumnType(targetCol.type === 'SERIAL' ? 'INT' : targetCol.type, dialect)

  const lines = [
    `  ${srcFkName} ${srcType} NOT NULL`,
    `  ${tgtFkName} ${tgtType} NOT NULL`,
    `  PRIMARY KEY (${srcFkName}, ${tgtFkName})`,
    `  FOREIGN KEY (${srcFkName}) REFERENCES ${sourceTable.name}(${sourceCol.name})`,
    `  FOREIGN KEY (${tgtFkName}) REFERENCES ${targetTable.name}(${targetCol.name})`,
  ]

  const suffix = dialect === 'mysql' ? ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;' : ');'
  return `CREATE TABLE ${junctionName} (\n${lines.join(',\n')}\n${suffix}`
}

function generateInlineForeignKeys(
  table: DiagramSchema['tables'][0],
  relationships: DiagramSchema['relationships'],
  tables: DiagramSchema['tables'],
): Array<string> {
  const tableMap = new Map(tables.map((t) => [t.id, t]))
  const fkLines: Array<string> = []

  for (const rel of relationships) {
    if (rel.relationType === 'N:M') continue
    if (rel.targetTableId !== table.id) continue

    const sourceTable = tableMap.get(rel.sourceTableId)
    if (!sourceTable) continue

    const sourceCol = sourceTable.columns.find((c) => c.id === rel.sourceColumnId)
    const targetCol = table.columns.find((c) => c.id === rel.targetColumnId)
    if (!sourceCol || !targetCol) continue

    fkLines.push(`  FOREIGN KEY (${targetCol.name}) REFERENCES ${sourceTable.name}(${sourceCol.name})`)
  }

  return fkLines
}

export function generateSql(schema: DiagramSchema, dialect: SqlDialect): string {
  if (schema.tables.length === 0) return ''

  const sorted = topologicalSort(schema.tables, schema.relationships)
  const parts: Array<string> = []

  for (const table of sorted) {
    if (dialect === 'sqlite') {
      // For SQLite, inline FK constraints in CREATE TABLE
      const fkLines = generateInlineForeignKeys(table, schema.relationships, schema.tables)
      const createSql = generateCreateTable(table, dialect)
      if (fkLines.length > 0) {
        // Insert FK lines before the closing );
        const closingIdx = createSql.lastIndexOf(');')
        const beforeClose = createSql.slice(0, closingIdx).trimEnd()
        parts.push(`${beforeClose},\n${fkLines.join(',\n')}\n);`)
      } else {
        parts.push(createSql)
      }
    } else {
      parts.push(generateCreateTable(table, dialect))
    }
  }

  // Generate junction tables for N:M relationships
  for (const rel of schema.relationships) {
    if (rel.relationType === 'N:M') {
      const junction = generateJunctionTable(rel, schema.tables, dialect)
      if (junction) parts.push(junction)
    }
  }

  // Generate ALTER TABLE FK statements (PostgreSQL, MySQL only)
  if (dialect !== 'sqlite') {
    const fkSql = generateForeignKeys(schema.relationships, schema.tables, dialect)
    if (fkSql) parts.push(fkSql)
  }

  return parts.join('\n\n')
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
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, '')
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

  if (consumed < tokens.length && tokens[consumed].startsWith('(')) {
    let parenPart = ''
    while (consumed < tokens.length) {
      parenPart += tokens[consumed]
      consumed++
      if (parenPart.includes(')')) break
    }
    rawType += parenPart
  } else if (rawType.includes('(')) {
    // nothing to do
  }

  return { consumed, rawType }
}

function splitColumnDefs(body: string): Array<string> {
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

function parseColumnDef(def: string, mintColumn: () => string): {
  column: ParsedColumn | null
  fkRef: FkRef | null
  isPkConstraint: string | null
  isUniqueConstraint: string | null
} {
  const trimmed = def.trim()
  const upper = trimmed.toUpperCase()

  const pkMatch = upper.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/)
  if (pkMatch) {
    return { column: null, fkRef: null, isPkConstraint: unquoteName(pkMatch[1]), isUniqueConstraint: null }
  }

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

  const uniqueMatch = upper.match(/^UNIQUE\s*\(([^)]+)\)/)
  if (uniqueMatch) {
    return { column: null, fkRef: null, isPkConstraint: null, isUniqueConstraint: unquoteName(uniqueMatch[1]) }
  }

  if (upper.startsWith('CONSTRAINT')) {
    const afterConstraint = trimmed.replace(/^CONSTRAINT\s+\S+\s+/i, '')
    return parseColumnDef(afterConstraint, mintColumn)
  }

  const tokens = trimmed.split(/\s+/)
  if (tokens.length < 2) return { column: null, fkRef: null, isPkConstraint: null, isUniqueConstraint: null }

  const name = unquoteName(tokens[0])

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
    id: mintColumn(),
    name,
    type: isAutoIncrement && mappedType === 'INT' ? 'INT' : mappedType,
  }

  return { column, fkRef: inlineFkRef, isPkConstraint: null, isUniqueConstraint: null }
}

function parseCreateTable(statement: string, mintColumn: () => string): {
  columns: Array<ParsedColumn>
  fkRefs: Array<FkRef>
  tableName: string
} | null {
  const tableMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?\s*\(/i)
  if (!tableMatch) return null

  const tableName = tableMatch[1]

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
    const parsed = parseColumnDef(def, mintColumn)

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

  for (const pkName of pkColumns) {
    const col = columns.find((c) => c.name.toLowerCase() === pkName.toLowerCase())
    if (col) {
      col.constraints.isPrimaryKey = true
      col.constraints.isNullable = false
      col.constraints.isUnique = true
    }
  }

  for (const uName of uniqueColumns) {
    const col = columns.find((c) => c.name.toLowerCase() === uName.toLowerCase())
    if (col) {
      col.constraints.isUnique = true
    }
  }

  return { columns, fkRefs, tableName }
}


function buildRelationships(
  parsedTables: Array<{ columns: Array<ParsedColumn>; fkRefs: Array<FkRef>; tableName: string }>,
  layoutedTables: DiagramSchema['tables'],
  mintRelation: () => string,
): DiagramSchema['relationships'] {
  const relationships: DiagramSchema['relationships'] = []

  const tableByName = new Map<string, DiagramSchema['tables'][number]>()
  for (const lt of layoutedTables) {
    tableByName.set(lt.name.toLowerCase(), lt)
  }

  for (let i = 0; i < parsedTables.length; i++) {
    const parsed = parsedTables[i]
    const sourceLayouted = layoutedTables[i]

    for (const fkRef of parsed.fkRefs) {
      const referencedTable = tableByName.get(fkRef.referencedTable.toLowerCase())
      if (!referencedTable) continue

      const referencedCol = referencedTable.columns.find(
        (c) => c.name.toLowerCase() === fkRef.referencedColumn.toLowerCase(),
      )
      const sourceCol = sourceLayouted.columns.find((c) => c.name.toLowerCase() === fkRef.sourceColumn.toLowerCase())
      if (!referencedCol || !sourceCol) continue

      sourceCol.constraints.isForeignKey = true

      const relationType = sourceCol.constraints.isUnique ? '1:1' : '1:N'

      relationships.push({
        id: mintRelation(),
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

export function parseSqlDdl(sql: string, dialect: SqlDialect, minters: EntityIdMinters): ParseResult {
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
      const result = parseCreateTable(stmt, minters.column)
      if (result) {
        parsedTables.push(result)
      } else {
        const idx = cleaned.indexOf(stmt)
        const line = (cleaned.slice(0, idx).match(/\n/g) ?? []).length + 1
        errors.push({ line, message: `[${dialect}] Failed to parse CREATE TABLE statement near line ${line}` })
      }
    } else if (stmt.length > 0 && !/^\s*$/.test(stmt)) {
      const idx = cleaned.indexOf(stmt)
      const line = (cleaned.slice(0, idx).match(/\n/g) ?? []).length + 1
      errors.push({ line, message: `[${dialect}] Unsupported statement near line ${line}: ${stmt.slice(0, 60)}...` })
    }
  }

  const positions = gridLayoutPositions(parsedTables.length)
  const tables: Array<DiagramSchema['tables'][number]> = parsedTables.map((t, i) => ({
    columns: t.columns.map((c) => ({
      constraints: { ...c.constraints },
      id: c.id,
      name: c.name,
      type: c.type,
    })),
    id: minters.table(),
    name: t.tableName,
    position: positions[i] ?? { x: 0, y: 0 },
  }))
  const relationships = buildRelationships(parsedTables, tables, minters.relation)

  return { errors, relationships, tables }
}
