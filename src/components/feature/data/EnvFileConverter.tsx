import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterModes, EnvConvertMode, EnvResult, ToolComponentProps } from '@/types'
import { envToJson, envToYaml, jsonToEnv, yamlToEnv } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['env-file-converter']

const MODES: ConverterModes<EnvConvertMode> = [
  {
    key: 'env-to-json',
    label: '.env → JSON',
    sourceLabel: '.env Input',
    sourcePlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY="sk-abc123"\n# Comment line',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "DATABASE_URL": "postgres://localhost:5432/mydb"\n}',
  },
  {
    key: 'env-to-yaml',
    label: '.env → YAML',
    sourceLabel: '.env Input',
    sourcePlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY="sk-abc123"',
    resultLabel: 'YAML Output',
    resultPlaceholder: 'DATABASE_URL: postgres://localhost:5432/mydb',
  },
  {
    key: 'json-to-env',
    label: 'JSON → .env',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{\n  "DATABASE_URL": "postgres://localhost:5432/mydb"\n}',
    resultLabel: '.env Output',
    resultPlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb',
  },
  {
    key: 'yaml-to-env',
    label: 'YAML → .env',
    sourceLabel: 'YAML Input',
    sourcePlaceholder: 'DATABASE_URL: postgres://localhost:5432/mydb\nAPI_KEY: sk-abc123',
    resultLabel: '.env Output',
    resultPlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb',
  },
]

const EMPTY_RESULT: EnvResult = { output: '', warnings: [] }

const compute = async ({ mode, source }: { mode: EnvConvertMode; source: string }): Promise<EnvResult> => {
  switch (mode) {
    case 'env-to-json':
      return envToJson(source)
    case 'env-to-yaml':
      return await envToYaml(source)
    case 'json-to-env':
      return { output: jsonToEnv(source), warnings: [] }
    case 'yaml-to-env':
      return { output: await yamlToEnv(source), warnings: [] }
  }
}

export const EnvFileConverter = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <BidirectionalConverter<EnvConvertMode, EnvResult>
    autoOpen={autoOpen}
    compute={compute}
    description={toolEntry?.description}
    initialResult={EMPTY_RESULT}
    modeStorageKey="env-file-converter"
    modes={MODES}
    onAfterClose={onAfterClose}
    renderBanner={(result) =>
      result.warnings.length > 0 ? (
        <p className="text-body-sm text-warning" role="status">
          {result.warnings.join('; ')}
        </p>
      ) : null
    }
  />
)
