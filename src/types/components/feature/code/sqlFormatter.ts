import type { SqlFormatDialect } from '@/utils'

export type SqlInput = { dialect: SqlFormatDialect; indent: number; source: string }
