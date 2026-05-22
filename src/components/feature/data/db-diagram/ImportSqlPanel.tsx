import { sql as sqlLang } from '@codemirror/lang-sql'
import { useMemo, useState } from 'react'

import { SelectInput } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { ImportSqlPanelProps, SqlDialect } from '@/types'

import { DIALECT_OPTIONS } from './constants'
import { ImportSidePanel } from './ImportSidePanel'

export const ImportSqlPanel = ({ onClose }: ImportSqlPanelProps) => {
  const { editor } = useDiagram()
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')
  const sqlExtensions = useMemo(() => [sqlLang()], [])

  return (
    <ImportSidePanel
      controls={
        <>
          <span className="text-xs text-gray-400">Dialect:</span>
          <SelectInput
            block={false}
            name="import-dialect-select"
            onChange={(value) => setDialect(value as SqlDialect)}
            options={DIALECT_OPTIONS}
            size="compact"
            value={dialect}
          />
        </>
      }
      extensions={sqlExtensions}
      onClose={onClose}
      onImport={(text, { merge }) => editor.importFromSql(text, dialect, { merge }).errors}
      placeholder="Paste CREATE TABLE statements..."
      testId="import-sql-panel"
      title="Import SQL"
    />
  )
}
