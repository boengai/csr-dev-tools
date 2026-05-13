import { useMemo, useState } from 'react'

import { Button, CopyButton, SelectInput } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { ExportSqlPanelProps, SqlDialect } from '@/types'
import { downloadTextFile } from '@/utils'

import { CloseButton } from './CloseButton'
import { DIALECT_OPTIONS } from './constants'

export const ExportSqlPanel = ({ onClose }: ExportSqlPanelProps) => {
  const { document, editor } = useDiagram()
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')

  // document is an intentional reactive dep: re-runs when the diagram changes (editor state is external)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatedSql = useMemo(() => editor.toSql(dialect), [document, editor, dialect])

  const handleDownload = () => {
    if (!generatedSql) return
    const safeName = document.diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadTextFile(generatedSql, `${safeName}-${dialect}.sql`, 'application/sql')
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="sql-panel">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">SQL Export</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
        <span className="text-xs text-gray-400">Dialect:</span>
        <SelectInput
          block={false}
          name="dialect-select"
          onChange={(value) => setDialect(value as SqlDialect)}
          options={DIALECT_OPTIONS}
          size="compact"
          value={dialect}
        />
      </div>

      <div className="flex-1 overflow-auto p-3">
        <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="sql-output">
          {generatedSql || '-- Add tables and relationships to generate SQL'}
        </pre>
      </div>

      <div className="flex gap-2 border-t border-gray-800 px-3 py-2">
        <CopyButton label="SQL" value={generatedSql} />
        <div className="grow">
          <Button
            block
            data-testid="download-sql-btn"
            disabled={!generatedSql}
            onClick={handleDownload}
            size="small"
            variant="primary"
          >
            Download .sql
          </Button>
        </div>
      </div>
    </div>
  )
}
