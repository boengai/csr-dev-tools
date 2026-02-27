import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { getTomlParseError } from '@/utils/toml'

type ConvertMode = 'json-to-toml' | 'toml-to-json'

const toolEntry = TOOL_REGISTRY_MAP['toml-to-json-converter']

export const TomlToJsonConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('toml-to-json')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const sessionRef = useRef(0)

  const process = async (val: string, m: ConvertMode) => {
    const session = ++sessionRef.current
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      const { tomlToJson, jsonToToml } = await import('@/utils/toml')
      const converted = m === 'toml-to-json' ? await tomlToJson(val) : await jsonToToml(val)
      if (session !== sessionRef.current) return
      setResult(converted)
    } catch {
      if (session !== sessionRef.current) return
      setResult('')
      if (m === 'toml-to-json') {
        const msg = await getTomlParseError(val)
        if (session !== sessionRef.current) return
        toast({
          action: 'add',
          item: {
            label: msg ? `Invalid TOML: ${msg}` : 'Conversion failed — please check your input',
            type: 'error',
          },
        })
      } else {
        toast({
          action: 'add',
          item: { label: 'Invalid JSON — please check your input', type: 'error' },
        })
      }
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

  const isTomlMode = mode === 'toml-to-json'

  const sourceLabel = isTomlMode ? 'TOML Input' : 'JSON Input'
  const sourcePlaceholder = isTomlMode
    ? '[server]\nhost = "localhost"\nport = 8080'
    : '{\n  "server": {\n    "host": "localhost",\n    "port": 8080\n  }\n}'
  const resultLabel = isTomlMode ? 'JSON Output' : 'TOML Output'
  const resultPlaceholder = isTomlMode
    ? '{\n  "server": {\n    "host": "localhost",\n    "port": 8080\n  }\n}'
    : '[server]\nhost = "localhost"\nport = 8080'
  const dialogTitle = isTomlMode ? 'TOML → JSON' : 'JSON → TOML'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('toml-to-json')} variant="default">
            TOML → JSON
          </Button>
          <Button block onClick={() => openDialog('json-to-toml')} variant="default">
            JSON → TOML
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title={dialogTitle}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label={sourceLabel}
                lineNumbers
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={sourcePlaceholder}
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                disabled={!result}
                label={
                  <span className="flex items-center gap-1">
                    <span>{resultLabel}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                name="result"
                placeholder={resultPlaceholder}
                rows={12}
                type="textarea"
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
