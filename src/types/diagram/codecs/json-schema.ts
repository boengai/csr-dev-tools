export type JsonSchemaProperty = {
  $ref?: string
  description?: string
  format?: string
  items?: JsonSchemaProperty
  type?: string
}

export type JsonSchemaDefinition = {
  properties?: Record<string, JsonSchemaProperty>
  required?: Array<string>
  type?: string
}

export type JsonSchemaRoot = {
  $defs?: Record<string, JsonSchemaDefinition>
  definitions?: Record<string, JsonSchemaDefinition>
}
