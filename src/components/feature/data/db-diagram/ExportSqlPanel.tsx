import { useMemo, useState } from 'react'

import { Button, CopyButton, SelectInput } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import type { ExportSqlPanelProps, SqlDialect } from '@/types'
import { downloadBlob } from '@/utils'

import { DIALECT_OPTIONS } from './constants'
import { DiagramSidePanel } from './DiagramSidePanel'

export const ExportSqlPanel = ({ onClose }: ExportSqlPanelProps) => {
  const { document, editor } = useDiagram()
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')

  // document is an intentional reactive dep: re-runs when the diagram changes (editor state is external)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generatedSql = useMemo(() => editor.toSql(dialect), [document, editor, dialect])

  const handleDownload = () => {
    if (!generatedSql) return
    const safeName = document.diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadBlob(new Blob([generatedSql], { type: 'application/sql' }), `${safeName}-${dialect}.sql`)
  }

  return (
    <DiagramSidePanel
      controls={
        <>
          <span className="text-xs text-gray-400">Dialect:</span>
          <SelectInput
            block={false}
            name="dialect-select"
            onChange={(value) => setDialect(value as SqlDialect)}
            options={DIALECT_OPTIONS}
            size="compact"
            value={dialect}
          />
        </>
      }
      footer={
        <div className="flex gap-2">
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
      }
      onClose={onClose}
      testId="sql-panel"
      title="SQL Export"
    >
      <pre className="text-xs font-mono break-all whitespace-pre-wrap text-gray-300" data-testid="sql-output">
        {generatedSql || '-- Add tables and relationships to generate SQL'}
      </pre>
    </DiagramSidePanel>
  )
}
