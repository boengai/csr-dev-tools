import { useEffect, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
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
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
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

  const openDialog = (m: EnvConvertMode) => {
    setMode(m)
    setSource('')
    setDialogOpen(true)
    setInputImmediate({ source: '', mode: m })
  }

  const handleReset = () => {
    setSource('')
    setInputImmediate({ source: '', mode })
  }

  const config = MODE_CONFIG[mode]

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('env-to-json')} variant="default">
            .env → JSON
          </Button>
          <Button block onClick={() => openDialog('env-to-yaml')} variant="default">
            .env → YAML
          </Button>
          <Button block onClick={() => openDialog('json-to-env')} variant="default">
            JSON → .env
          </Button>
          <Button block onClick={() => openDialog('yaml-to-env')} variant="default">
            YAML → .env
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title={config.dialogTitle}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label={config.sourceLabel}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={config.sourcePlaceholder}
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
