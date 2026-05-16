import { FieldForm, FormatterShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { SqlInput, ToolComponentProps } from '@/types'
import { formatSql, type SqlFormatDialect } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['sql-formatter']

const INITIAL: SqlInput = { source: '', dialect: 'sql', indent: 2 }

export const SqlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  return (
    <FormatterShell<SqlInput>
      autoOpen={autoOpen}
      compute={({ source, dialect, indent }) => formatSql(source, dialect, indent)}
      description={toolEntry?.description}
      errorLabel="Unable to format SQL"
      initial={INITIAL}
      onAfterDialogClose={onAfterDialogClose}
      renderControls={({ inputs, setFieldsImmediate }) => (
        <>
          <FieldForm
            label="Dialect"
            name="dialect"
            onChange={(val: string) => setFieldsImmediate({ dialect: val as SqlFormatDialect })}
            options={[
              { label: 'Standard SQL', value: 'sql' },
              { label: 'PostgreSQL', value: 'postgresql' },
              { label: 'MySQL', value: 'mysql' },
              { label: 'SQLite', value: 'sqlite' },
              { label: 'BigQuery', value: 'bigquery' },
            ]}
            type="select"
            value={inputs.dialect}
          />
          <FieldForm
            label="Indent"
            name="indent"
            onChange={(val: string) => setFieldsImmediate({ indent: Number(val) })}
            options={[
              { label: '2 spaces', value: '2' },
              { label: '4 spaces', value: '4' },
            ]}
            type="select"
            value={String(inputs.indent)}
          />
        </>
      )}
      resultPlaceholder="Formatted SQL will appear here"
      sourceLabel="SQL Input"
      sourcePlaceholder="SELECT id, name FROM users WHERE active = 1 ORDER BY name"
      storageKey="csr-dev-tools-sql-formatter"
      title="SQL Formatter"
      triggerLabel="Format"
    />
  )
}
