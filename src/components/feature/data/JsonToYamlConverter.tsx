import { useEffect, useRef, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useToast, useToolComputation } from '@/hooks'
import type { JsonYamlConvertMode, JsonYamlInput } from '@/types'
import { getJsonParseError, getYamlParseError, jsonToYaml, yamlToJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-yaml-converter']

const sourceKey = (m: JsonYamlConvertMode) => `csr-dev-tools-${m}-source`

const readSource = (m: JsonYamlConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const JsonToYamlConverter = () => {
  const [mode, setMode] = useInputLocalStorage<JsonYamlConvertMode>('csr-dev-tools-json-to-yaml-mode', 'json-to-yaml')
  const [source, setSource] = useState(() => readSource(mode))
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

  const { result, setInput, setInputImmediate } = useToolComputation<JsonYamlInput, string>(
    async ({ source: val, mode: m }) => {
      try {
        return m === 'json-to-yaml' ? await jsonToYaml(val) : await yamlToJson(val)
      } catch {
        if (m === 'json-to-yaml') {
          const msg = await getJsonParseError(val)
          throw new Error(msg ? `Invalid JSON: ${msg}` : 'Conversion failed — please check your input')
        }
        const msg = await getYamlParseError(val)
        throw new Error(msg ? `Invalid YAML: ${msg}` : 'Conversion failed — please check your input')
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

  const openDialog = (m: JsonYamlConvertMode) => {
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

  const isJsonMode = mode === 'json-to-yaml'

  const sourceLabel = isJsonMode ? 'JSON Input' : 'YAML Input'
  const sourcePlaceholder = isJsonMode ? '{"name":"John","age":30}' : 'name: John\nage: 30'
  const resultLabel = isJsonMode ? 'YAML Output' : 'JSON Output'
  const resultPlaceholder = isJsonMode ? 'name: John\nage: 30' : '{\n  "name": "John",\n  "age": 30\n}'
  const dialogTitle = isJsonMode ? 'JSON → YAML' : 'YAML → JSON'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('json-to-yaml')} variant="default">
            JSON → YAML
          </Button>
          <Button block onClick={() => openDialog('yaml-to-json')} variant="default">
            YAML → JSON
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
