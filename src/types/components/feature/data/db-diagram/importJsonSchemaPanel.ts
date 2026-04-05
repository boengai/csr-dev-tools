import type { Extension } from '@codemirror/state'

export type ImportJsonSchemaPanelProps = {
  importJsonSchemaErrors: Array<string>
  importJsonSchemaMerge: boolean
  importJsonSchemaText: string
  jsonExtensions: Array<Extension>
  onClose: () => void
  onImport: () => void
  setImportJsonSchemaMerge: (value: boolean) => void
  setImportJsonSchemaText: (value: string) => void
}
