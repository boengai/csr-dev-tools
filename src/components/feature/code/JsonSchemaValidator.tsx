import { FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolFieldsPersisted } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type ValidationResult, validateJsonSchema } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-schema-validator']

type ValidatorInput = { jsonData: string; jsonSchema: string }

export const JsonSchemaValidator = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const { inputs, recompute, result, setFields } = useToolFieldsPersisted<ValidatorInput, ValidationResult | null>({
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
  const handleRevalidate = () => recompute()

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      onReset={handleRevalidate}
      title="JSON Schema Validator"
      triggers={[
        {
          label: 'Validate',
          onOpen: () => {
            if (jsonData.trim() && jsonSchema.trim()) {
              recompute()
            }
          },
        },
      ]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="JSON Data"
              name="json-data"
              onChange={handleDataChange}
              placeholder='{"name": "John", "age": 30}'
              type="code"
              value={jsonData}
            />
          </Pane>

          <Pane>
            <FieldForm
              label="JSON Schema"
              name="json-schema"
              onChange={handleSchemaChange}
              placeholder='{"type": "object", "properties": {"name": {"type": "string"}}}'
              type="code"
              value={jsonSchema}
            />
          </Pane>
        </SplitPanel>

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
                  <li className="text-red-300 font-mono text-body-xs" key={`${err.path}-${err.keyword}-${err.message}`}>
                    <span className="text-red-400">{err.path}</span> — {err.message}{' '}
                    <span className="text-red-500">(keyword: {err.keyword})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </ToolDialogFrame>
  )
}
