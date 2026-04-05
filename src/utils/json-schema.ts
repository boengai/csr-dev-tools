import Ajv from 'ajv'
import type { ValidationError, ValidationResult } from "@/types/utils/json-schema";

export function validateJsonSchema(data: string, schema: string): ValidationResult {
  let parsedData: unknown
  try {
    parsedData = JSON.parse(data)
  } catch {
    return { errors: [{ keyword: 'parse', message: 'Invalid JSON in data input', path: '/' }], valid: false }
  }

  let parsedSchema: Record<string, unknown>
  try {
    parsedSchema = JSON.parse(schema)
  } catch {
    return { errors: [{ keyword: 'parse', message: 'Invalid JSON in schema input', path: '/' }], valid: false }
  }

  try {
    const ajv = new Ajv({ allErrors: true })
    const validate = ajv.compile(parsedSchema)
    const valid = validate(parsedData)

    if (valid) {
      return { errors: null, valid: true }
    }

    const errors: Array<ValidationError> = (validate.errors ?? []).map((err) => ({
      keyword: err.keyword,
      message: err.message ?? 'Unknown error',
      path: err.instancePath || '/',
    }))

    return { errors, valid: false }
  } catch {
    return { errors: [{ keyword: 'schema', message: 'Invalid JSON Schema', path: '/' }], valid: false }
  }
}

export type { ValidationError, ValidationResult } from "@/types/utils/json-schema";
