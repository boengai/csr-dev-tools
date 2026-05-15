import { CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { SqlInput, ToolComponentProps } from '@/types'
import { formatSql, type SqlFormatDialect } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['sql-formatter']

export const SqlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { toast } = useToast()

  const { inputs, result, setFields, setFieldsImmediate } = useToolFields<SqlInput, string>({
    compute: ({ source: val, dialect: d, indent: ind }) => formatSql(val, d, ind),
    debounceMs: 300,
    initial: { source: '', dialect: 'sql', indent: 2 },
    initialResult: '',
    isEmpty: ({ source: val }) => val.trim().length === 0,
    onError: () => {
      toast({ action: 'add', item: { label: 'Unable to format SQL', type: 'error' } })
    },
  })
  const { source, dialect, indent } = inputs

  const handleSourceChange = (val: string) => setFields({ source: val })
  const handleDialectChange = (val: string) => setFieldsImmediate({ dialect: val as SqlFormatDialect })
  const handleIndentChange = (val: string) => setFieldsImmediate({ indent: Number(val) })
  const handleReset = () => setFieldsImmediate({ source: '' })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="SQL Formatter"
      triggers={[{ label: 'Format' }]}
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
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="SQL Input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder="SELECT id, name FROM users WHERE active = 1 ORDER BY name"
              type="code"
              value={source}
            />
          </div>

          <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>Formatted SQL</span>
                  <CopyButton label="formatted SQL" value={result} />
                </span>
              }
              placeholder="Formatted SQL will appear here"
              value={result}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
