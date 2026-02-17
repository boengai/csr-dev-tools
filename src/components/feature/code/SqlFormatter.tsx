import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { SqlDialect } from '@/utils/sql-format'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { formatSql } from '@/utils/sql-format'

const toolEntry = TOOL_REGISTRY_MAP['sql-formatter']

export const SqlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [dialect, setDialect] = useState<SqlDialect>('sql')
  const [indent, setIndent] = useState(2)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const process = (val: string, d: SqlDialect, ind: number) => {
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      setResult(formatSql(val, d, ind))
    } catch {
      setResult('')
      toast({ action: 'add', item: { label: 'Unable to format SQL', type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, dialect, indent)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleDialectChange = (val: string) => {
    const d = val as SqlDialect
    setDialect(d)
    if (source.trim().length > 0) {
      process(source, d, indent)
    }
  }

  const handleIndentChange = (val: string) => {
    const ind = Number(val)
    setIndent(ind)
    if (source.trim().length > 0) {
      process(source, dialect, ind)
    }
  }

  const handleReset = () => {
    setSource('')
    setResult('')
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Format
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title="SQL Formatter"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <FieldForm
              label="Dialect"
              name="dialect"
              onChange={handleDialectChange}
              options={[
                { label: 'Standard SQL', value: 'sql' },
                { label: 'PostgreSQL', value: 'postgresql' },
                { label: 'MySQL', value: 'mysql' },
                { label: 'SQLite', value: 'sqlite' },
                { label: 'BigQuery', value: 'bigquery' },
              ]}
              type="select"
              value={dialect}
            />
            <FieldForm
              label="Indent"
              name="indent"
              onChange={handleIndentChange}
              options={[
                { label: '2 spaces', value: '2' },
                { label: '4 spaces', value: '4' },
              ]}
              type="select"
              value={String(indent)}
            />
          </div>

          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="SQL Input"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="SELECT id, name FROM users WHERE active = 1 ORDER BY name"
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                disabled={!result}
                label={
                  <span className="flex items-center gap-1">
                    <span>Formatted SQL</span>
                    <CopyButton label="formatted SQL" value={result} />
                  </span>
                }
                name="result"
                placeholder="Formatted SQL will appear here"
                rows={12}
                type="textarea"
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
