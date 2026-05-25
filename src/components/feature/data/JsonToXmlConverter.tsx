import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonXmlConvertMode, ToolComponentProps } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['json-to-xml-converter']

const MODES: [ConverterMode<JsonXmlConvertMode>, ConverterMode<JsonXmlConvertMode>] = [
  {
    key: 'xml-to-json',
    label: 'XML → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "root": {\n    "name": "John",\n    "age": 30\n  }\n}',
    sourceFormat: 'xml',
    sourceLabel: 'XML Input',
    sourcePlaceholder: '<root>\n  <name>John</name>\n  <age>30</age>\n</root>',
  },
  {
    key: 'json-to-xml',
    label: 'JSON → XML',
    resultLabel: 'XML Output',
    resultPlaceholder: '<root>\n  <name>John</name>\n  <age>30</age>\n</root>',
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

export const JsonToXmlConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => (
  <BidirectionalConverter
    autoOpen={autoOpen}
    compute={compute}
    description={toolEntry?.description}
    initialResult={{ output: '' }}
    modeStorageKey="json-to-xml"
    modes={MODES}
    onAfterDialogClose={onAfterDialogClose}
  />
)
