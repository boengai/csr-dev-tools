import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonYamlConvertMode, ToolComponentProps } from '@/types'
import { jsonToYaml, yamlToJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-yaml-converter']

const MODES: [ConverterMode<JsonYamlConvertMode>, ConverterMode<JsonYamlConvertMode>] = [
  {
    key: 'json-to-yaml',
    label: 'JSON → YAML',
    resultLabel: 'YAML Output',
    resultPlaceholder: 'name: John\nage: 30',
    sourceFormat: 'json',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{"name":"John","age":30}',
  },
  {
    key: 'yaml-to-json',
    label: 'YAML → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "name": "John",\n  "age": 30\n}',
    sourceFormat: 'yaml',
    sourceLabel: 'YAML Input',
    sourcePlaceholder: 'name: John\nage: 30',
  },
]

const compute = async ({
  mode,
  source,
}: {
  mode: JsonYamlConvertMode
  source: string
}): Promise<{ output: string }> => {
  const output = mode === 'json-to-yaml' ? await jsonToYaml(source) : await yamlToJson(source)
  return { output }
}

export const JsonToYamlConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => (
  <BidirectionalConverter
    autoOpen={autoOpen}
    compute={compute}
    description={toolEntry?.description}
    initialResult={{ output: '' }}
    modeStorageKey="json-to-yaml"
    modes={MODES}
    onAfterDialogClose={onAfterDialogClose}
  />
)
