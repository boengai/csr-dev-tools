import { format } from 'sql-formatter'

export type SqlDialect = 'bigquery' | 'mysql' | 'postgresql' | 'sql' | 'sqlite'

export const formatSql = (sql: string, dialect: SqlDialect = 'sql', indent: number = 2): string => {
  if (sql.trim().length === 0) return ''

  return format(sql, {
    language: dialect,
    tabWidth: indent,
    useTabs: false,
    keywordCase: 'upper',
  })
}
