import type { SqlFormatDialect } from '@/wasm/formatter'

export type SqlInput = { dialect: SqlFormatDialect; indent: number; source: string }
