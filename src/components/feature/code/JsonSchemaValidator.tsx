import { useState } from 'react'

import { Button, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolFieldsPersisted } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type ValidationResult, validateJsonSchema } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-schema-validator']

type ValidatorInput = { jsonData: string; jsonSchema: string }

export const JsonSchemaValidator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  const { inputs, result, setFields, setFieldsImmediate } = useToolFieldsPersisted<ValidatorInput, ValidationResult | null>({
    compute: ({ jsonData: data, jsonSchema: schema }) => validateJsonSchema(data, schema),
    debounceMs: 300,
    initial: { jsonData: '', jsonSchema: '' },
    initialResult: null,
    isEmpty: ({ jsonData: data, jsonSchema: schema }) => data.trim().length === 0 || schema.trim().length === 0,
    storageKey: 'csr-dev-tools-json-schema-validator',
  })
  const { jsonData, jsonSchema } = inputs

  const handleDataChange = (val: string) => setFields({ jsonData: val })
  const handleSchemaChange = (val: string) => setFields({ jsonSchema: val })
  // Re-fires compute with the current bag (preserves pre-migration behavior); does NOT clear fields. The hook's `reset()` would clear — intentionally not used here.
  const handleRevalidate = () => setFieldsImmediate({})

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button
            block
            onClick={() => {
              setDialogOpen(true)
              if (jsonData.trim() && jsonSchema.trim()) {
                setFieldsImmediate({})
              }
            }}
            variant="default"
          >
            Validate
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleRevalidate}
        open={dialogOpen}
        size="screen"
        title="JSON Schema Validator"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JSON Data"
                name="json-data"
                onChange={handleDataChange}
                placeholder='{"name": "John", "age": 30}'
                type="code"
                value={jsonData}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JSON Schema"
                name="json-schema"
                onChange={handleSchemaChange}
                placeholder='{"type": "object", "properties": {"name": {"type": "string"}}}'
                type="code"
                value={jsonSchema}
              />
            </div>
          </div>

          <div aria-live="polite">
            {result?.valid && (
              <div className="border-green-800 bg-green-950 rounded-lg border p-3">
                <p className="text-green-400 text-body-sm">✅ Valid — JSON conforms to the schema</p>
              </div>
            )}

            {result && !result.valid && result.errors && result.errors[0]?.keyword === 'parse' && (
              <div className="border-red-800 bg-red-950 rounded-lg border p-3">
                <p className="text-red-400 text-body-sm">❌ {result.errors[0].message}</p>
              </div>
            )}

            {result && !result.valid && result.errors && result.errors[0]?.keyword !== 'parse' && (
              <div className="border-red-800 bg-red-950 rounded-lg border p-3">
                <p className="text-red-400 mb-2 text-body-sm font-medium">❌ Validation Errors</p>
                <ul className="flex flex-col gap-1">
                  {result.errors.map((err) => (
                    <li
                      className="text-red-300 font-mono text-body-xs"
                      key={`${err.path}-${err.keyword}-${err.message}`}
                    >
                      <span className="text-red-400">{err.path}</span> — {err.message}{' '}
                      <span className="text-red-500">(keyword: {err.keyword})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
