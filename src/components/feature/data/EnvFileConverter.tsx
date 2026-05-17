import { useEffect, useState } from 'react'

import { CodeOutput, CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { EnvConvertMode, EnvInput, EnvResult, ToolComponentProps } from '@/types'
import { envToJson, envToYaml, jsonToEnv, yamlToEnv } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['env-file-converter']

const MODE_CONFIG: Record<
  EnvConvertMode,
  {
    dialogTitle: string
    sourceLabel: string
    sourcePlaceholder: string
    resultLabel: string
    resultPlaceholder: string
  }
> = {
  'env-to-json': {
    dialogTitle: '.env → JSON',
    sourceLabel: '.env Input',
    sourcePlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY="sk-abc123"\n# Comment line',
    resultLabel: 'JSON Output',
    resultPlaceholder: '{\n  "DATABASE_URL": "postgres://localhost:5432/mydb"\n}',
  },
  'env-to-yaml': {
    dialogTitle: '.env → YAML',
    sourceLabel: '.env Input',
    sourcePlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY="sk-abc123"',
    resultLabel: 'YAML Output',
    resultPlaceholder: 'DATABASE_URL: postgres://localhost:5432/mydb',
  },
  'json-to-env': {
    dialogTitle: 'JSON → .env',
    sourceLabel: 'JSON Input',
    sourcePlaceholder: '{\n  "DATABASE_URL": "postgres://localhost:5432/mydb"\n}',
    resultLabel: '.env Output',
    resultPlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb',
  },
  'yaml-to-env': {
    dialogTitle: 'YAML → .env',
    sourceLabel: 'YAML Input',
    sourcePlaceholder: 'DATABASE_URL: postgres://localhost:5432/mydb\nAPI_KEY: sk-abc123',
    resultLabel: '.env Output',
    resultPlaceholder: 'DATABASE_URL=postgres://localhost:5432/mydb',
  },
}

const EMPTY_RESULT: EnvResult = { output: '', warnings: [] }

export const EnvFileConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [mode, setMode] = useState<EnvConvertMode>('env-to-json')
  const { showError } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<EnvInput, EnvResult>(
    async ({ source: val, mode: m }) => {
      switch (m) {
        case 'env-to-json': {
          const r = envToJson(val)
          return { output: r.output, warnings: r.warnings }
        }
        case 'env-to-yaml': {
          const r = await envToYaml(val)
          return { output: r.output, warnings: r.warnings }
        }
        case 'json-to-env':
          return { output: jsonToEnv(val), warnings: [] }
        case 'yaml-to-env':
          return { output: await yamlToEnv(val), warnings: [] }
      }
    },
    {
      debounceMs: 300,
      initial: EMPTY_RESULT,
      isEmpty: ({ source: val }) => val.trim().length === 0,
      onError: (e) => {
        const msg = e instanceof Error ? e.message : 'Conversion failed'
        showError(msg)
      },
    },
  )

  useEffect(() => {
    if (result.warnings.length > 0) {
      showError(result.warnings.join('; '))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast identity stable; fire only on warnings change
  }, [result.warnings])

  const handleSourceChange = (val: string) => {
    setSource(val)
    setInput({ source: val, mode })
  }

  const seedMode = (m: EnvConvertMode) => () => {
    setMode(m)
    setSource('')
    setInputImmediate({ source: '', mode: m })
  }

  const handleReset = () => {
    setSource('')
    setInputImmediate({ source: '', mode })
  }

  const config = MODE_CONFIG[mode]

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title={config.dialogTitle}
      triggers={[
        { label: '.env → JSON', onOpen: seedMode('env-to-json') },
        { label: '.env → YAML', onOpen: seedMode('env-to-yaml') },
        { label: 'JSON → .env', onOpen: seedMode('json-to-env') },
        { label: 'YAML → .env', onOpen: seedMode('yaml-to-env') },
      ]}
    >
        <div className="flex w-full grow flex-col gap-4">
          <SplitPanel>
            <Pane>
              <FieldForm
                label={config.sourceLabel}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={config.sourcePlaceholder}
                type="code"
                value={source}
              />
            </Pane>

            <Pane live>
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>{config.resultLabel}</span>
                    <CopyButton label="result" value={result.output} />
                  </span>
                }
                placeholder={config.resultPlaceholder}
                value={result.output}
              />
            </Pane>
          </SplitPanel>
        </div>
    </ToolDialogFrame>
  )
}
