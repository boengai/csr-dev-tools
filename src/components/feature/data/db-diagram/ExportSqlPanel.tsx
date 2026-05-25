import { useState } from 'react'

import { Button, SelectInput } from '@/components/common'
import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'
import { useDownload } from '@/hooks'
import type { ExportSqlPanelProps, SqlDialect } from '@/types'

import { DIALECT_OPTIONS } from './constants'
import { ExportSidePanel } from './ExportSidePanel'

export const ExportSqlPanel = ({ onClose }: ExportSqlPanelProps) => {
  const { document } = useDiagram()
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')
  const { downloadBlob } = useDownload()

  const handleDownload = (sql: string) => {
    if (!sql) return
    const safeName = document.diagramName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
    downloadBlob(new Blob([sql], { type: 'application/sql' }), `${safeName}-${dialect}.sql`)
  }

  return (
    <ExportSidePanel
      action={(value) => (
        <Button
          block
          data-testid="download-sql-btn"
          disabled={!value}
          onClick={() => handleDownload(value)}
          size="small"
          variant="primary"
        >
          Download .sql
        </Button>
      )}
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
      copyLabel="SQL"
      derive={(ed) => ed.toSql(dialect)}
      emptyPlaceholder="-- Add tables and relationships to generate SQL"
      extraDeps={[dialect]}
      onClose={onClose}
      testId="sql-panel"
      title="SQL Export"
    />
  )
}
