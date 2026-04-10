import { Button, CheckboxInput, CodeInput } from '@/components/common'
import type { ImportJsonSchemaPanelProps } from '@/types/components/feature/data/db-diagram/importJsonSchemaPanel'

import { CloseButton } from './CloseButton'

export const ImportJsonSchemaPanel = ({
  importJsonSchemaErrors,
  importJsonSchemaMerge,
  importJsonSchemaText,
  jsonExtensions,
  onClose,
  onImport,
  setImportJsonSchemaMerge,
  setImportJsonSchemaText,
}: ImportJsonSchemaPanelProps) => {
  return (
    <div
      className="flex w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950"
      data-testid="import-json-schema-panel"
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
        <span className="text-xs font-bold text-white">Import JSON Schema</span>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex-1 overflow-auto p-3">
        <CodeInput
          extensions={jsonExtensions}
          height="192px"
          name="import-json-schema-input"
          onChange={setImportJsonSchemaText}
          placeholder="Paste JSON Schema..."
          size="compact"
          value={importJsonSchemaText}
        />

        {importJsonSchemaErrors.length > 0 && (
          <div className="mt-2 space-y-1" data-testid="import-json-schema-errors">
            {importJsonSchemaErrors.map((err) => (
              <p className="text-[10px] text-error" key={err}>
                {err}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-800 px-3 py-2">
        <label className="flex items-center gap-2 text-[10px] text-gray-400" htmlFor="import-json-schema-merge">
          <CheckboxInput
            checked={importJsonSchemaMerge}
            id="import-json-schema-merge"
            name="import-json-schema-merge"
            onChange={setImportJsonSchemaMerge}
          />
          Merge with existing (otherwise replaces)
        </label>
        <Button
          block
          data-testid="import-json-schema-submit"
          disabled={!importJsonSchemaText.trim()}
          onClick={onImport}
          size="small"
          variant="primary"
        >
          Import
        </Button>
      </div>
    </div>
  )
}
