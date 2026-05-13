import { useEffect, useRef, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useToast, useToolComputation } from '@/hooks'
import type { JsonCsvConvertMode, JsonCsvInput } from '@/types'
import { csvToJson, getCsvParseError, getJsonParseError, jsonToCsv } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-csv-converter']

const sourceKey = (m: JsonCsvConvertMode) => `csr-dev-tools-${m}-source`

const readSource = (m: JsonCsvConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const JsonToCsvConverter = () => {
  const [mode, setMode] = useInputLocalStorage<JsonCsvConvertMode>('csr-dev-tools-json-to-csv-mode', 'json-to-csv')
  const [source, setSource] = useState(() => readSource(mode))
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

  const { result, setInput, setInputImmediate } = useToolComputation<JsonCsvInput, string>(
    async ({ source: val, mode: m }) => {
      try {
        return m === 'json-to-csv' ? await jsonToCsv(val) : await csvToJson(val)
      } catch (e) {
        if (m === 'json-to-csv') {
          const message = e instanceof Error ? e.message : ''
          if (
            message.startsWith('JSON must be an array of objects') ||
            message.startsWith('JSON array must contain at least one object') ||
            message.startsWith('All array items must be objects')
          ) {
            throw new Error(message)
          }
          const msg = await getJsonParseError(val)
          throw new Error(msg ? `Invalid JSON: ${msg}` : 'Conversion failed — please check your input')
        }
        const msg = await getCsvParseError(val)
        throw new Error(msg ?? 'Conversion failed — please check your input')
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

  const openDialog = (m: JsonCsvConvertMode) => {
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

  const isJsonMode = mode === 'json-to-csv'

  const sourceLabel = isJsonMode ? 'JSON Input' : 'CSV Input'
  const sourcePlaceholder = isJsonMode ? '[{"name":"Alice","age":30}]' : 'name,age\nAlice,30\nBob,25'
  const resultLabel = isJsonMode ? 'CSV Output' : 'JSON Output'
  const resultPlaceholder = isJsonMode ? 'name,age\nAlice,30' : '[\n  {\n    "name": "Alice"\n  }\n]'
  const dialogTitle = isJsonMode ? 'JSON → CSV' : 'CSV → JSON'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('json-to-csv')} variant="default">
            JSON → CSV
          </Button>
          <Button block onClick={() => openDialog('csv-to-json')} variant="default">
            CSV → JSON
          </Button>
        </div>
      </div>
      <ToolDialogShell
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
