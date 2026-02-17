import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import { type ValidationResult, validateJsonSchema } from '@/utils/json-schema'

const toolEntry = TOOL_REGISTRY_MAP['json-schema-validator']

export const JsonSchemaValidator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [jsonData, setJsonData] = useState('')
  const [jsonSchema, setJsonSchema] = useState('')
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  const validate = (data: string, schema: string) => {
    if (data.trim().length === 0 && schema.trim().length === 0) {
      setResult(null)
      return
    }
    if (data.trim().length === 0 || schema.trim().length === 0) {
      setResult(null)
      return
    }
    setResult(validateJsonSchema(data, schema))
  }

  const debouncedValidate = useDebounceCallback((data: string, schema: string) => {
    validate(data, schema)
  }, 300)

  const handleDataChange = (val: string) => {
    setJsonData(val)
    debouncedValidate(val, jsonSchema)
  }

  const handleSchemaChange = (val: string) => {
    setJsonSchema(val)
    debouncedValidate(jsonData, val)
  }

  const handleReset = () => {
    setJsonData('')
    setJsonSchema('')
    setResult(null)
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
            Validate
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title="JSON Schema Validator"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JSON Data"
                name="json-data"
                onChange={handleDataChange}
                placeholder='{"name": "John", "age": 30}'
                rows={16}
                type="textarea"
                value={jsonData}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JSON Schema"
                name="json-schema"
                onChange={handleSchemaChange}
                placeholder='{"type": "object", "properties": {"name": {"type": "string"}}}'
                rows={16}
                type="textarea"
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
                  {result.errors.map((err, i) => (
                    <li className="text-red-300 font-mono text-body-xs" key={i}>
                      <span className="text-red-400">{err.path}</span> — {err.message}{' '}
                      <span className="text-red-500">(keyword: {err.keyword})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  )
}
