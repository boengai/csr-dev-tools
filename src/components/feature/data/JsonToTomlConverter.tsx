import { useEffect, useRef, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useToast, useToolComputation } from '@/hooks'
import type { JsonTomlConvertMode, TomlJsonInput, ToolComponentProps } from '@/types'
import { getTomlParseError } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-toml-converter']

const sourceKey = (m: JsonTomlConvertMode) => `csr-dev-tools-${m}-source`

const readSource = (m: JsonTomlConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const JsonToTomlConverter = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [mode, setMode] = useInputLocalStorage<JsonTomlConvertMode>('csr-dev-tools-json-to-toml-mode', 'toml-to-json')
  const [source, setSource] = useState(() => readSource(mode))
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

  const { result, setInput, setInputImmediate } = useToolComputation<TomlJsonInput, string>(
    async ({ source: val, mode: m }) => {
      const { tomlToJson, jsonToToml } = await import('@/utils/toml')
      try {
        return m === 'toml-to-json' ? await tomlToJson(val) : await jsonToToml(val)
      } catch {
        if (m === 'toml-to-json') {
          const msg = await getTomlParseError(val)
          throw new Error(msg ? `Invalid TOML: ${msg}` : 'Conversion failed — please check your input')
        }
        throw new Error('Invalid JSON — please check your input')
      }
    },
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ source: val }) => val.trim().length === 0,
      onError: (err) => {
        const label = err instanceof Error ? err.message : 'Conversion failed — please check your input'
        toast({ action: 'add', item: { label, type: 'error' } })
      },
    },
  )

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) setInputImmediate({ source, mode })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    try {
      localStorage.setItem(sourceKey(modeRef.current), JSON.stringify(val))
    } catch {}
    setInput({ source: val, mode })
  }

  const openDialog = (m: JsonTomlConvertMode) => {
    setMode(m)
    modeRef.current = m
    const restored = readSource(m)
    setSource(restored)
    setDialogOpen(true)
    setInputImmediate({ source: restored, mode: m })
  }

  const handleReset = () => {
    setInputImmediate({ source: '', mode })
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
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('toml-to-json')} variant="default">
            TOML → JSON
          </Button>
          <Button block onClick={() => openDialog('json-to-toml')} variant="default">
            JSON → TOML
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
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
      </ToolDialogShell>
    </>
  )
}
