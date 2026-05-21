import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonTomlConvertMode, ToolComponentProps } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['json-to-toml-converter']

const MODES: [ConverterMode<JsonTomlConvertMode>, ConverterMode<JsonTomlConvertMode>] = [
  {
    key: 'toml-to-json',
    label: 'TOML → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "server": {\n    "host": "localhost",\n    "port": 8080\n  }\n}',
    sourceFormat: 'toml',
    sourceLabel: 'TOML Input',
    sourcePlaceholder: '[server]\nhost = "localhost"\nport = 8080',
  },
  {
    key: 'json-to-toml',
    label: 'JSON → TOML',
    resultLabel: 'TOML Output',
    resultPlaceholder: '[server]\nhost = "localhost"\nport = 8080',
    sourceFormat: 'json',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{\n  "server": {\n    "host": "localhost",\n    "port": 8080\n  }\n}',
  },
]

const compute = async ({
  mode,
  source,
}: {
  mode: JsonTomlConvertMode
  source: string
}): Promise<{ output: string }> => {
  const { jsonToToml, tomlToJson } = await import('@/wasm/parsers')
  const output = mode === 'toml-to-json' ? await tomlToJson(source) : await jsonToToml(source)
  return { output }
}

export const JsonToTomlConverter = ({ onAfterDialogClose }: ToolComponentProps) => (
  <BidirectionalConverter
    compute={compute}
    description={toolEntry?.description}
    initialResult={{ output: '' }}
    modeStorageKey="json-to-toml"
    modes={MODES}
    onAfterDialogClose={onAfterDialogClose}
  />
)
