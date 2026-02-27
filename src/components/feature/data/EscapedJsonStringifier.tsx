import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CheckboxInput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { parseStringifiedJson, stringifyJson } from '@/utils/escaped-json'

type ConvertMode = 'stringify' | 'parse'

const toolEntry = TOOL_REGISTRY_MAP['escaped-json-stringifier']

export const EscapedJsonStringifier = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('stringify')
  const [doubleEscape, setDoubleEscape] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const sessionRef = useRef(0)

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

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    sessionRef.current++
    setMode(m)
    setDoubleEscape(false)
    setSource('')
    setResult('')
    setDialogOpen(true)
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
    setSource('')
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
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label={isStringify ? 'JSON Input' : 'Escaped String Input'}
                lineNumbers
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={isStringify ? '{"name":"John","age":30}' : '{\\"name\\":\\"John\\",\\"age\\":30}'}
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
                    <span>{isStringify ? 'Escaped Output' : 'Parsed JSON'}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                name="result"
                placeholder={isStringify ? '{\\"name\\":\\"John\\",\\"age\\":30}' : '{\n  "name": "John"\n}'}
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
