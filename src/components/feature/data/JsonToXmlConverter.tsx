import { CodecShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CodecMode, JsonXmlConvertMode, ToolComponentProps } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['json-to-xml-converter']

const MODES: [CodecMode<JsonXmlConvertMode>, CodecMode<JsonXmlConvertMode>] = [
  {
    key: 'xml-to-json',
    label: 'XML → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: 'Paste XML to convert it to JSON',
    sourceFormat: 'xml',
    sourceLabel: 'XML Input',
    sourcePlaceholder: '<root>\n  <name>John</name>\n  <age>30</age>\n</root>',
  },
  {
    key: 'json-to-xml',
    label: 'JSON → XML',
    resultLabel: 'XML Output',
    resultPlaceholder: 'Paste JSON to convert it to XML',
    sourceFormat: 'json',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{\n  "root": {\n    "name": "John",\n    "age": 30\n  }\n}',
  },
]

const compute = async ({ mode, source }: { mode: JsonXmlConvertMode; source: string }): Promise<{ output: string }> => {
  const { jsonToXml, xmlToJson } = await import('@/wasm/parsers')
  const output = mode === 'xml-to-json' ? await xmlToJson(source) : await jsonToXml(source)
  return { output }
}

export const JsonToXmlConverter = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <CodecShell
    autoOpen={autoOpen}
    compute={compute}
    description={toolEntry?.description}
    initialResult={{ output: '' }}
    modeStorageKey="json-to-xml"
    modes={MODES}
    onAfterClose={onAfterClose}
  />
)
