import { useState } from 'react'

import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { readJsonStorage, writeJsonStorage } from '@/hooks'
import type { JsonSchemaValidatorInput, ToolComponentProps, ValidationError } from '@/types'
import { validateJsonSchema } from '@/utils/json-schema'

const toolEntry = TOOL_REGISTRY_MAP['json-schema-validator']

const STORAGE_KEY = 'csr-dev-tools-json-schema-validator'

const INITIAL: JsonSchemaValidatorInput = { schema: '', source: '' }

// Bags saved before the shell were `{ jsonData, jsonSchema }`; carry them over
// once so the shell restores them instead of a bag with no `source`.
const migrateStoredBag = (): true => {
  const { jsonData, jsonSchema, schema, source } = readJsonStorage(STORAGE_KEY, {
    ...INITIAL,
    jsonData: '',
    jsonSchema: '',
  })
  if (jsonData || jsonSchema) {
    writeJsonStorage<JsonSchemaValidatorInput>(STORAGE_KEY, {
      schema: schema || jsonSchema,
      source: source || jsonData,
    })
  }
  return true
}

const describeErrors = (errors: Array<ValidationError>): string => {
  // A parse or schema-compile failure is one message with no path.
  const [first] = errors
  if (errors.length === 1 && first && (first.keyword === 'parse' || first.keyword === 'schema')) return first.message
  const lines = errors.map((err) => `${err.path} — ${err.message} (keyword: ${err.keyword})`)
  return [`${errors.length} validation error${errors.length === 1 ? '' : 's'}:`, ...lines].join('\n')
}

// Invalid data rejects, so the error list lands in the status slot and the
// output clears. Valid data comes back formatted, with a "valid" notice.
const computeValidation = ({ schema, source }: JsonSchemaValidatorInput): string => {
  const result = validateJsonSchema(source, schema)
  if (!result.valid) throw new Error(describeErrors(result.errors ?? []))
  return JSON.stringify(JSON.parse(source), null, 2)
}

export const JsonSchemaValidator = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  useState(migrateStoredBag)

  return (
    <TransformerShell<JsonSchemaValidatorInput>
      autoOpen={autoOpen}
      compute={computeValidation}
      description={toolEntry?.description}
      errorFallback="Unable to validate this JSON"
      initial={INITIAL}
      notices={(result) => (result ? ['Valid — the JSON conforms to the schema'] : [])}
      onAfterClose={onAfterClose}
      resultLabel="Validated JSON"
      resultPlaceholder="Paste JSON data and a JSON Schema on the left to validate the data"
      secondSource={{
        field: 'schema',
        label: 'JSON Schema',
        placeholder: '{"type": "object", "properties": {"name": {"type": "string"}}}',
      }}
      sourceLabel="JSON Data"
      sourcePlaceholder='{"name": "John", "age": 30}'
      storageKey={STORAGE_KEY}
      title="JSON Schema Validator"
      triggerLabel="Validate"
    />
  )
}
