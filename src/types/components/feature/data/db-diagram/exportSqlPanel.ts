import type { SqlDialect } from '@/types'

export type ExportSqlPanelProps = {
  generatedSql: string
  onClose: () => void
  onDownload: () => void
  setSqlDialect: (value: SqlDialect) => void
  sqlDialect: SqlDialect
}
