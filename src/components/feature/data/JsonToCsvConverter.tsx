import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonCsvConvertMode } from '@/types'
import { csvToJson, getCsvParseError, getJsonParseError, jsonToCsv } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-csv-converter']

const MODES: [ConverterMode<JsonCsvConvertMode>, ConverterMode<JsonCsvConvertMode>] = [
  {
    key: 'json-to-csv',
    label: 'JSON → CSV',
    resultLabel: 'CSV Output',
    resultPlaceholder: 'name,age\nAlice,30',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '[{"name":"Alice","age":30}]',
  },
  {
    key: 'csv-to-json',
    label: 'CSV → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '[\n  {\n    "name": "Alice"\n  }\n]',
    sourceLabel: 'CSV Input',
    sourcePlaceholder: 'name,age\nAlice,30\nBob,25',
  },
]

const compute = async ({ mode, source }: { mode: JsonCsvConvertMode; source: string }): Promise<string> => {
  try {
    return mode === 'json-to-csv' ? await jsonToCsv(source) : await csvToJson(source)
  } catch (e) {
    if (mode === 'json-to-csv') {
      const message = e instanceof Error ? e.message : ''
      if (
        message.startsWith('JSON must be an array of objects') ||
        message.startsWith('JSON array must contain at least one object') ||
        message.startsWith('All array items must be objects')
      ) {
        throw new Error(message)
      }
      const msg = await getJsonParseError(source)
      throw new Error(msg ? `Invalid JSON: ${msg}` : 'Conversion failed — please check your input')
    }
    const msg = await getCsvParseError(source)
    throw new Error(msg ?? 'Conversion failed — please check your input')
  }
}

export const JsonToCsvConverter = () => (
  <BidirectionalConverter
    compute={compute}
    description={toolEntry?.description}
    modeStorageKey="json-to-csv"
    modes={MODES}
  />
)
