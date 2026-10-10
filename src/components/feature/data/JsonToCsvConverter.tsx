import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonCsvConvertMode, ToolComponentProps } from '@/types'
import { csvToJson, jsonToCsv } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-csv-converter']

const MODES: [ConverterMode<JsonCsvConvertMode>, ConverterMode<JsonCsvConvertMode>] = [
  {
    key: 'json-to-csv',
    label: 'JSON → CSV',
    resultLabel: 'CSV Output',
    resultPlaceholder: 'name,age\nAlice,30',
    sourceFormat: 'json',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '[{"name":"Alice","age":30}]',
  },
  {
    key: 'csv-to-json',
    label: 'CSV → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '[\n  {\n    "name": "Alice"\n  }\n]',
    sourceFormat: 'csv',
    sourceLabel: 'CSV Input',
    sourcePlaceholder: 'name,age\nAlice,30\nBob,25',
  },
]

// Shape-validation throws from jsonToCsv (e.g. 'JSON must be an array of
// objects') fire for valid JSON. The shell's narrator returns null on
// parse-valid input, so those messages flow through unchanged.
const compute = async ({ mode, source }: { mode: JsonCsvConvertMode; source: string }): Promise<{ output: string }> => {
  const output = mode === 'json-to-csv' ? await jsonToCsv(source) : await csvToJson(source)
  return { output }
}

export const JsonToCsvConverter = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <BidirectionalConverter
    autoOpen={autoOpen}
    compute={compute}
    description={toolEntry?.description}
    initialResult={{ output: '' }}
    modeStorageKey="json-to-csv"
    modes={MODES}
    onAfterClose={onAfterClose}
  />
)
