import type { SqlDialect } from '@/types'

export const DIALECT_OPTIONS: Array<{ label: string; value: SqlDialect }> = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'SQLite', value: 'sqlite' },
]
