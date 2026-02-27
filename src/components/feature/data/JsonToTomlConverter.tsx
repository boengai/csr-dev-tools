import { useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useLocalStorage, useToast } from '@/hooks'
import { getTomlParseError } from '@/utils/toml'

type ConvertMode = 'json-to-toml' | 'toml-to-json'

const toolEntry = TOOL_REGISTRY_MAP['json-to-toml-converter']

const sourceKey = (m: ConvertMode) => `csr-dev-tools-${m}-source`

const readSource = (m: ConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const JsonToTomlConverter = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [mode, setMode] = useLocalStorage<ConvertMode>('csr-dev-tools-json-to-toml-mode', 'toml-to-json')
  const [source, setSource] = useState(() => readSource(mode))
  const [result, setResult] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const sessionRef = useRef(0)
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

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

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) process(source, mode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    try {
      localStorage.setItem(sourceKey(modeRef.current), JSON.stringify(val))
    } catch {}
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    sessionRef.current++
    setMode(m)
    modeRef.current = m
    const restored = readSource(m)
    setSource(restored)
    setResult('')
    setDialogOpen(true)
    if (restored.trim()) process(restored, m)
  }

  const handleReset = () => {
    sessionRef.current++
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
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label={sourceLabel}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={sourcePlaceholder}
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>{resultLabel}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder={resultPlaceholder}
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
