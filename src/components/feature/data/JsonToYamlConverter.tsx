import { useRef, useState } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { getJsonParseError, getYamlParseError, jsonToYaml, yamlToJson } from '@/utils'

type ConvertMode = 'json-to-yaml' | 'yaml-to-json'

const toolEntry = TOOL_REGISTRY_MAP['json-to-yaml-converter']

export const JsonToYamlConverter = () => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('json-to-yaml')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { clearError, error, setError } = useToolError()
  const sessionRef = useRef(0)

  const process = async (val: string, m: ConvertMode) => {
    const session = sessionRef.current
    if (val.trim().length === 0) {
      setResult('')
      clearError()
      return
    }
    try {
      const converted = m === 'json-to-yaml' ? await jsonToYaml(val) : await yamlToJson(val)
      if (session !== sessionRef.current) return
      setResult(converted)
      clearError()
    } catch {
      if (session !== sessionRef.current) return
      setResult('')
      if (m === 'json-to-yaml') {
        const msg = getJsonParseError(val)
        setError(msg ? `Invalid JSON: ${msg}` : 'Conversion failed — please check your input')
      } else {
        const msg = await getYamlParseError(val)
        if (session !== sessionRef.current) return
        setError(msg ? `Invalid YAML: ${msg}` : 'Conversion failed — please check your input')
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
    sessionRef.current++
    setMode(m)
    setSource('')
    setResult('')
    clearError()
    setDialogOpen(true)
  }

  const handleReset = () => {
    sessionRef.current++
    setSource('')
    setResult('')
    clearError()
  }

  const isJsonMode = mode === 'json-to-yaml'

  const sourceLabel = isJsonMode ? 'JSON Input' : 'YAML Input'
  const sourcePlaceholder = isJsonMode ? '{"name":"John","age":30}' : 'name: John\nage: 30'
  const resultLabel = isJsonMode ? 'YAML Output' : 'JSON Output'
  const resultPlaceholder = isJsonMode ? 'name: John\nage: 30' : '{\n  "name": "John",\n  "age": 30\n}'
  const dialogTitle = isJsonMode ? 'JSON → YAML' : 'YAML → JSON'

  return (
    <div className="flex size-full grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => openDialog('json-to-yaml')} variant="default">
          JSON → YAML
        </Button>
        <Button block onClick={() => openDialog('yaml-to-json')} variant="default">
          YAML → JSON
        </Button>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title={dialogTitle}
      >
        <div className="flex size-full grow flex-col gap-4">
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

            <div className="flex min-h-0 flex-1 flex-col gap-2">
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
    </div>
  )
}
