import { format } from 'sql-formatter'
import type { SqlFormatDialect } from "@/types/utils/sql-format";

export const formatSql = (sql: string, dialect: SqlFormatDialect = 'sql', indent: number = 2): string => {
  if (sql.trim().length === 0) return ''

  return format(sql, {
    language: dialect,
    tabWidth: indent,
    useTabs: false,
    keywordCase: 'upper',
  })
}

export type { SqlFormatDialect } from "@/types/utils/sql-format";
