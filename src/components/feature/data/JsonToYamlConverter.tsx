import { useRef, useState } from 'react'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { getJsonParseError, getYamlParseError, jsonToYaml, yamlToJson } from '@/utils'

type ConvertMode = 'json-to-yaml' | 'yaml-to-json'

const toolEntry = TOOL_REGISTRY_MAP['json-to-yaml-converter']

export const JsonToYamlConverter = () => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('json-to-yaml')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const sessionRef = useRef(0)

  const process = async (val: string, m: ConvertMode) => {
    const session = ++sessionRef.current
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      const converted = m === 'json-to-yaml' ? await jsonToYaml(val) : await yamlToJson(val)
      if (session !== sessionRef.current) return
      setResult(converted)
    } catch {
      if (session !== sessionRef.current) return
      setResult('')
      if (m === 'json-to-yaml') {
        const msg = getJsonParseError(val)
        toast({
          action: 'add',
          item: { label: msg ? `Invalid JSON: ${msg}` : 'Conversion failed — please check your input', type: 'error' },
        })
      } else {
        const msg = await getYamlParseError(val)
        if (session !== sessionRef.current) return
        toast({
          action: 'add',
          item: { label: msg ? `Invalid YAML: ${msg}` : 'Conversion failed — please check your input', type: 'error' },
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

  const isJsonMode = mode === 'json-to-yaml'

  const sourceLabel = isJsonMode ? 'JSON Input' : 'YAML Input'
  const sourcePlaceholder = isJsonMode ? '{"name":"John","age":30}' : 'name: John\nage: 30'
  const resultLabel = isJsonMode ? 'YAML Output' : 'JSON Output'
  const resultPlaceholder = isJsonMode ? 'name: John\nage: 30' : '{\n  "name": "John",\n  "age": 30\n}'
  const dialogTitle = isJsonMode ? 'JSON → YAML' : 'YAML → JSON'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('json-to-yaml')} variant="default">
            JSON → YAML
          </Button>
          <Button block onClick={() => openDialog('yaml-to-json')} variant="default">
            YAML → JSON
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
