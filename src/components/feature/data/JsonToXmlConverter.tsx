import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonXmlConvertMode, ToolComponentProps } from '@/types'
import { formatParseError } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-xml-converter']

const MODES: [ConverterMode<JsonXmlConvertMode>, ConverterMode<JsonXmlConvertMode>] = [
  {
    key: 'xml-to-json',
    label: 'XML → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "root": {\n    "name": "John",\n    "age": 30\n  }\n}',
    sourceLabel: 'XML Input',
    sourcePlaceholder: '<root>\n  <name>John</name>\n  <age>30</age>\n</root>',
  },
  {
    key: 'json-to-xml',
    label: 'JSON → XML',
    resultLabel: 'XML Output',
    resultPlaceholder: '<root>\n  <name>John</name>\n  <age>30</age>\n</root>',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{\n  "root": {\n    "name": "John",\n    "age": 30\n  }\n}',
  },
]

const compute = async ({ mode, source }: { mode: JsonXmlConvertMode; source: string }): Promise<string> => {
  const { xmlToJson, jsonToXml } = await import('@/wasm/parsers')
  try {
    return mode === 'xml-to-json' ? await xmlToJson(source) : await jsonToXml(source)
  } catch {
    if (mode === 'xml-to-json') {
      const { getXmlParseError } = await import('@/wasm/parsers')
      throw new Error(formatParseError(await getXmlParseError(source), 'XML'))
    }
    const { getJsonParseError } = await import('@/wasm/json-tools')
    throw new Error(formatParseError(await getJsonParseError(source), 'JSON'))
  }
}

export const JsonToXmlConverter = ({ onAfterDialogClose }: ToolComponentProps) => (
  <BidirectionalConverter
    compute={compute}
    description={toolEntry?.description}
    modeStorageKey="json-to-xml"
    modes={MODES}
    onAfterDialogClose={onAfterDialogClose}
  />
)
