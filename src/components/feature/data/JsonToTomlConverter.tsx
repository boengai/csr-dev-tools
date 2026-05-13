import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, JsonTomlConvertMode, ToolComponentProps } from '@/types'
import { getTomlParseError } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-toml-converter']

const MODES: [ConverterMode<JsonTomlConvertMode>, ConverterMode<JsonTomlConvertMode>] = [
  {
    key: 'toml-to-json',
    label: 'TOML → JSON',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "server": {\n    "host": "localhost",\n    "port": 8080\n  }\n}',
    sourceLabel: 'TOML Input',
    sourcePlaceholder: '[server]\nhost = "localhost"\nport = 8080',
  },
  {
    key: 'json-to-toml',
    label: 'JSON → TOML',
    resultLabel: 'TOML Output',
    resultPlaceholder: '[server]\nhost = "localhost"\nport = 8080',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{\n  "server": {\n    "host": "localhost",\n    "port": 8080\n  }\n}',
  },
]

const compute = async ({ mode, source }: { mode: JsonTomlConvertMode; source: string }): Promise<string> => {
  const { tomlToJson, jsonToToml } = await import('@/wasm/parsers')
  try {
    return mode === 'toml-to-json' ? await tomlToJson(source) : await jsonToToml(source)
  } catch {
    if (mode === 'toml-to-json') {
      const msg = await getTomlParseError(source)
      throw new Error(msg ? `Invalid TOML: ${msg}` : 'Conversion failed — please check your input')
    }
    throw new Error('Invalid JSON — please check your input')
  }
}

export const JsonToTomlConverter = ({ onAfterDialogClose }: ToolComponentProps) => (
  <BidirectionalConverter
    compute={compute}
    description={toolEntry?.description}
    modeStorageKey="json-to-toml"
    modes={MODES}
    onAfterDialogClose={onAfterDialogClose}
  />
)
