import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { envToJson, envToYaml, jsonToEnv, yamlToEnv } from '@/utils/env'

type ConvertMode = 'env-to-json' | 'env-to-yaml' | 'json-to-env' | 'yaml-to-env'

const toolEntry = TOOL_REGISTRY_MAP['env-file-converter']

const MODE_CONFIG: Record<
  ConvertMode,
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

export const EnvFileConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('env-to-json')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const sessionRef = useRef(0)

  const process = (val: string, m: ConvertMode) => {
    const session = ++sessionRef.current
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      let output: string
      let warnings: Array<string> = []
      switch (m) {
        case 'env-to-json': {
          const r = envToJson(val)
          output = r.output
          warnings = r.warnings
          break
        }
        case 'env-to-yaml': {
          const r = envToYaml(val)
          output = r.output
          warnings = r.warnings
          break
        }
        case 'json-to-env':
          output = jsonToEnv(val)
          break
        case 'yaml-to-env':
          output = yamlToEnv(val)
          break
      }
      if (session !== sessionRef.current) return
      setResult(output)
      if (warnings.length > 0) {
        toast({ action: 'add', item: { label: warnings.join('; '), type: 'error' } })
      }
    } catch (e) {
      if (session !== sessionRef.current) return
      setResult('')
      const msg = e instanceof Error ? e.message : 'Conversion failed'
      toast({ action: 'add', item: { label: msg, type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    sessionRef.current++
    setMode(m)
    setSource('')
    setResult('')
    setDialogOpen(true)
  }

  const handleReset = () => {
    sessionRef.current++
    setSource('')
    setResult('')
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  const config = MODE_CONFIG[mode]

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

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

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
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
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder={config.resultPlaceholder}
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
