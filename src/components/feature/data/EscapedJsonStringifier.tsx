import { useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CheckboxInput, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useLocalStorage, useToast } from '@/hooks'
import { parseStringifiedJson, stringifyJson } from '@/utils/escaped-json'

type ConvertMode = 'stringify' | 'parse'

const toolEntry = TOOL_REGISTRY_MAP['escaped-json-stringifier']

const sourceKey = (m: ConvertMode) => `csr-dev-tools-escaped-json-${m}-source`

const readSource = (m: ConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const EscapedJsonStringifier = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [mode, setMode] = useLocalStorage<ConvertMode>('csr-dev-tools-escaped-json-mode', 'stringify')
  const [source, setSource] = useState(() => readSource(mode))
  const [result, setResult] = useState('')
  const [doubleEscape, setDoubleEscape] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const sessionRef = useRef(0)
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

  const process = (val: string, m: ConvertMode, dblEscape: boolean) => {
    const session = ++sessionRef.current
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      const output = m === 'stringify' ? stringifyJson(val, dblEscape) : parseStringifiedJson(val)
      if (session !== sessionRef.current) return
      setResult(output)
    } catch (e) {
      if (session !== sessionRef.current) return
      setResult('')
      const msg = e instanceof Error ? e.message : 'Conversion failed'
      toast({ action: 'add', item: { label: msg, type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode, doubleEscape)
  }, 300)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) process(source, mode, doubleEscape)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    try { localStorage.setItem(sourceKey(modeRef.current), JSON.stringify(val)) } catch {}
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    sessionRef.current++
    setMode(m)
    modeRef.current = m
    setDoubleEscape(false)
    const restored = readSource(m)
    setSource(restored)
    setResult('')
    setDialogOpen(true)
    if (restored.trim()) process(restored, m, false)
  }

  const handleDoubleEscapeChange = () => {
    const newVal = !doubleEscape
    setDoubleEscape(newVal)
    if (source.trim().length > 0) {
      process(source, mode, newVal)
    }
  }

  const handleReset = () => {
    sessionRef.current++
    setResult('')
    setDoubleEscape(false)
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  const isStringify = mode === 'stringify'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('stringify')} variant="default">
            Stringify
          </Button>
          <Button block onClick={() => openDialog('parse')} variant="default">
            Parse
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title={isStringify ? 'Stringify JSON' : 'Parse Escaped JSON'}
      >
        <div className="flex w-full grow flex-col gap-4">
          {isStringify && (
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400">
                <CheckboxInput checked={doubleEscape} onChange={() => handleDoubleEscapeChange()} />
                Double Escape
              </label>
            </div>
          )}

          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label={isStringify ? 'JSON Input' : 'Escaped String Input'}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={isStringify ? '{"name":"John","age":30}' : '{\\"name\\":\\"John\\",\\"age\\":30}'}
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>{isStringify ? 'Escaped Output' : 'Parsed JSON'}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder={isStringify ? '{\\"name\\":\\"John\\",\\"age\\":30}' : '{\n  "name": "John"\n}'}
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
