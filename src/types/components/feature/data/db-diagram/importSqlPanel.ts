import type { Extension } from '@codemirror/state'
import type { SqlDialect } from '@/types'

export type ImportSqlPanelProps = {
  importSqlDialect: SqlDialect
  importSqlErrors: Array<{ line: number; message: string }>
  importSqlMerge: boolean
  importSqlText: string
  onClose: () => void
  onImport: () => void
  setImportSqlDialect: (value: SqlDialect) => void
  setImportSqlMerge: (value: boolean) => void
  setImportSqlText: (value: string) => void
  sqlExtensions: Array<Extension>
}
