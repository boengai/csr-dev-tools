import type { SqlFormatDialect } from '@/types/utils/sql-format'

import { formatSql as wasmFormatSql } from '@/wasm/formatter'

export const formatSql = async (sql: string, dialect: SqlFormatDialect = 'sql', indent: number = 2): Promise<string> => {
  if (sql.trim().length === 0) return ''
  return wasmFormatSql(sql, dialect, indent)
}

export type { SqlFormatDialect } from '@/types/utils/sql-format'
