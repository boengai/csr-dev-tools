import { useEffect, useRef, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useToast, useToolComputation } from '@/hooks'
import type { JsonXmlConvertMode, ToolComponentProps, XmlJsonInput } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['json-to-xml-converter']

const sourceKey = (m: JsonXmlConvertMode) => `csr-dev-tools-${m}-source`

const readSource = (m: JsonXmlConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const JsonToXmlConverter = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [mode, setMode] = useInputLocalStorage<JsonXmlConvertMode>('csr-dev-tools-json-to-xml-mode', 'xml-to-json')
  const [source, setSource] = useState(() => readSource(mode))
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

  const { result, setInput, setInputImmediate } = useToolComputation<XmlJsonInput, string>(
    async ({ source: val, mode: m }) => {
      const { xmlToJson, jsonToXml } = await import('@/utils/xml')
      try {
        return m === 'xml-to-json' ? await xmlToJson(val) : await jsonToXml(val)
      } catch {
        if (m === 'xml-to-json') {
          const { getXmlParseError } = await import('@/utils/xml')
          const msg = await getXmlParseError(val)
          throw new Error(msg ? `Invalid XML: ${msg}` : 'Conversion failed — please check your input')
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

  const openDialog = (m: JsonXmlConvertMode) => {
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

  const isXmlMode = mode === 'xml-to-json'

  const sourceLabel = isXmlMode ? 'XML Input' : 'JSON Input'
  const sourcePlaceholder = isXmlMode
    ? '<root>\n  <name>John</name>\n  <age>30</age>\n</root>'
    : '{\n  "root": {\n    "name": "John",\n    "age": 30\n  }\n}'
  const resultLabel = isXmlMode ? 'JSON Output' : 'XML Output'
  const resultPlaceholder = isXmlMode
    ? '{\n  "root": {\n    "name": "John",\n    "age": 30\n  }\n}'
    : '<root>\n  <name>John</name>\n  <age>30</age>\n</root>'
  const dialogTitle = isXmlMode ? 'XML → JSON' : 'JSON → XML'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('xml-to-json')} variant="default">
            XML → JSON
          </Button>
          <Button block onClick={() => openDialog('json-to-xml')} variant="default">
            JSON → XML
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
