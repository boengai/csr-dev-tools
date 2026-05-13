import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonYamlConvertMode } from '@/types'
import { getJsonParseError, getYamlParseError, jsonToYaml, yamlToJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-yaml-converter']

const MODES: [ConverterMode<JsonYamlConvertMode>, ConverterMode<JsonYamlConvertMode>] = [
  {
    key: 'json-to-yaml',
    label: 'JSON → YAML',
    resultLabel: 'YAML Output',
    resultPlaceholder: 'name: John\nage: 30',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{"name":"John","age":30}',
  },
  {
    key: 'yaml-to-json',
    label: 'YAML → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "name": "John",\n  "age": 30\n}',
    sourceLabel: 'YAML Input',
    sourcePlaceholder: 'name: John\nage: 30',
  },
]

const compute = async ({ mode, source }: { mode: JsonYamlConvertMode; source: string }): Promise<string> => {
  try {
    return mode === 'json-to-yaml' ? await jsonToYaml(source) : await yamlToJson(source)
  } catch {
    if (mode === 'json-to-yaml') {
      const msg = await getJsonParseError(source)
      throw new Error(msg ? `Invalid JSON: ${msg}` : 'Conversion failed — please check your input')
    }
    const msg = await getYamlParseError(source)
    throw new Error(msg ? `Invalid YAML: ${msg}` : 'Conversion failed — please check your input')
  }
}

export const JsonToYamlConverter = () => (
  <BidirectionalConverter
    compute={compute}
    description={toolEntry?.description}
    modeStorageKey="json-to-yaml"
    modes={MODES}
  />
)
