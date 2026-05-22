import { json } from '@codemirror/lang-json'

import type { ImportJsonSchemaPanelProps } from '@/types'

import { useDiagram } from './DiagramContext'
import { ImportSidePanel } from './ImportSidePanel'

const jsonExtensions = [json()]

export const ImportJsonSchemaPanel = ({ onClose }: ImportJsonSchemaPanelProps) => {
  const { editor } = useDiagram()

  return (
    <ImportSidePanel
      extensions={jsonExtensions}
      onClose={onClose}
      onImport={(text, { merge }) => editor.importFromJsonSchema(text, { merge }).errors}
      placeholder="Paste JSON Schema..."
      testId="import-json-schema-panel"
      title="Import JSON Schema"
    />
  )
}
