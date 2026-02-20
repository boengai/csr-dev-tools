import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'

type ConvertMode = 'json-to-xml' | 'xml-to-json'

const toolEntry = TOOL_REGISTRY_MAP['xml-to-json-converter']

export const XmlToJsonConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('xml-to-json')
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
      const { xmlToJson, jsonToXml } = await import('@/utils/xml')
      const converted = m === 'xml-to-json' ? await xmlToJson(val) : await jsonToXml(val)
      if (session !== sessionRef.current) return
      setResult(converted)
    } catch {
      if (session !== sessionRef.current) return
      setResult('')
      if (m === 'xml-to-json') {
        const { getXmlParseError } = await import('@/utils/xml')
        const msg = await getXmlParseError(val)
        if (session !== sessionRef.current) return
        toast({
          action: 'add',
          item: { label: msg ? `Invalid XML: ${msg}` : 'Conversion failed — please check your input', type: 'error' },
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
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('xml-to-json')} variant="default">
            XML → JSON
          </Button>
          <Button block onClick={() => openDialog('json-to-xml')} variant="default">
            JSON → XML
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
