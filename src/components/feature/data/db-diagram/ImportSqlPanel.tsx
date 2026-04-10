import { CheckboxInput, CodeInput, SelectInput } from '@/components/common'
import type { SqlDialect } from '@/types'
import type { ImportSqlPanelProps } from '@/types/components/feature/data/db-diagram/importSqlPanel'

import { CloseButton } from './CloseButton'
import { DIALECT_OPTIONS } from './constants'

export const ImportSqlPanel = ({
  importSqlDialect,
  importSqlErrors,
  importSqlMerge,
  importSqlText,
  onClose,
  onImport,
  setImportSqlDialect,
  setImportSqlMerge,
  setImportSqlText,
  sqlExtensions,
}: ImportSqlPanelProps) => {
  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950" data-testid="import-sql-panel">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">Import SQL</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
        <span className="text-xs text-gray-400">Dialect:</span>
        <SelectInput
          block={false}
          name="import-dialect-select"
          onChange={(value) => setImportSqlDialect(value as SqlDialect)}
          options={DIALECT_OPTIONS}
          size="compact"
          value={importSqlDialect}
        />
      </div>

      <div className="flex-1 overflow-auto p-3">
        <CodeInput
          extensions={sqlExtensions}
          height="192px"
          name="import-sql-input"
          onChange={setImportSqlText}
          placeholder="Paste CREATE TABLE statements..."
          size="compact"
          value={importSqlText}
        />

        {importSqlErrors.length > 0 && (
          <div className="mt-2 space-y-1" data-testid="import-sql-errors">
            {importSqlErrors.map((err) => (
              <p className="text-[10px] text-error" key={`${err.line}-${err.message}`}>
                {err.message}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-800 px-3 py-2">
        <label className="flex items-center gap-2 text-[10px] text-gray-400" htmlFor="import-sql-merge">
          <CheckboxInput
            checked={importSqlMerge}
            id="import-sql-merge"
            name="import-sql-merge"
            onChange={setImportSqlMerge}
          />
          Merge with existing (otherwise replaces)
        </label>
        <button
          className="text-xs w-full rounded bg-primary px-3 py-1.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          data-testid="import-sql-submit"
          disabled={!importSqlText.trim()}
          onClick={onImport}
          type="button"
        >
          Import
        </button>
      </div>
    </div>
  )
}
