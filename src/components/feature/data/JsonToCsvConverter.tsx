import { useState } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { csvToJson, getCsvParseError, getJsonParseError, jsonToCsv } from '@/utils'

type ConvertMode = 'csv-to-json' | 'json-to-csv'

const toolEntry = TOOL_REGISTRY_MAP['json-to-csv-converter']

export const JsonToCsvConverter = () => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('json-to-csv')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { clearError, error, setError } = useToolError()

  const process = (val: string, m: ConvertMode) => {
    if (val.trim().length === 0) {
      setResult('')
      clearError()
      return
    }
    try {
      const converted = m === 'json-to-csv' ? jsonToCsv(val) : csvToJson(val)
      setResult(converted)
      clearError()
    } catch (e) {
      setResult('')
      if (m === 'json-to-csv') {
        const message = e instanceof Error ? e.message : ''
        if (
          message.startsWith('JSON must be an array of objects') ||
          message.startsWith('JSON array must contain at least one object') ||
          message.startsWith('All array items must be objects')
        ) {
          setError(message)
        } else {
          const msg = getJsonParseError(val)
          setError(msg ? `Invalid JSON: ${msg}` : 'Conversion failed — please check your input')
        }
      } else {
        const msg = getCsvParseError(val)
        setError(msg ?? 'Conversion failed — please check your input')
      }
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode)
  }, 150)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    setMode(m)
    setSource('')
    setResult('')
    clearError()
    setDialogOpen(true)
  }

  const handleReset = () => {
    setSource('')
    setResult('')
    clearError()
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
        {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('json-to-csv')} variant="default">
            JSON → CSV
          </Button>
          <Button block onClick={() => openDialog('csv-to-json')} variant="default">
            CSV → JSON
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title={dialogTitle}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="tablet:flex-row flex size-full grow flex-col gap-6">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label={sourceLabel}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={sourcePlaceholder}
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="tablet:border-t-0 tablet:border-l-2 border-t-2 border-dashed border-gray-900" />

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

          {error != null && (
            <p className="text-error text-body-sm shrink-0" role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </>
  )
}
