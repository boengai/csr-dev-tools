import type { ColumnType, DiagramSchema, SqlDialect } from '@/types'

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
