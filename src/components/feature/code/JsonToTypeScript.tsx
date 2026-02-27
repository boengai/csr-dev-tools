import { useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useLocalStorage, useToast } from '@/hooks'
import { jsonToTypeScript } from '@/utils/json-to-typescript'

const toolEntry = TOOL_REGISTRY_MAP['json-to-typescript']

export const JsonToTypeScript = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [source, setSource] = useLocalStorage('csr-dev-tools-json-to-typescript-source', '')
  const [output, setOutput] = useState('')
  const [rootName, setRootName] = useState('Root')
  const [useInterface, setUseInterface] = useState(true)
  const [optionalProps, setOptionalProps] = useState(false)
  const { toast } = useToast()
  const initializedRef = useRef(false)

  const generate = useDebounceCallback((json: string, root: string, iface: boolean, optional: boolean) => {
    if (!json.trim()) {
      setOutput('')
      return
    }
    try {
      setOutput(jsonToTypeScript(json, { optionalProperties: optional, rootName: root, useInterface: iface }))
    } catch {
      setOutput('')
    }
  }, 300)

  const handleGenerate = () => {
    if (!source.trim()) {
      toast({ action: 'add', item: { label: 'Please enter JSON input', type: 'error' } })
      return
    }
    try {
      setOutput(jsonToTypeScript(source, { optionalProperties: optionalProps, rootName, useInterface }))
      toast({ action: 'add', item: { label: 'TypeScript generated successfully', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Invalid JSON input', type: 'error' } })
    }
  }

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) {
        try {
          setOutput(jsonToTypeScript(source, { optionalProperties: optionalProps, rootName, useInterface }))
        } catch {
          // invalid persisted JSON — ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    generate(val, rootName, useInterface, optionalProps)
  }

  const handleRootNameChange = (val: string) => {
    setRootName(val)
    generate(source, val, useInterface, optionalProps)
  }

  const handleToggleInterface = () => {
    const next = !useInterface
    setUseInterface(next)
    generate(source, rootName, next, optionalProps)
  }

  const handleToggleOptional = () => {
    const next = !optionalProps
    setOptionalProps(next)
    generate(source, rootName, useInterface, next)
  }

  const handleReset = () => {
    setOutput('')
    setRootName('Root')
    setUseInterface(true)
    setOptionalProps(false)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button
            block
            onClick={() => {
              setDialogOpen(true)
              if (source.trim()) {
                try {
                  setOutput(jsonToTypeScript(source, { optionalProperties: optionalProps, rootName, useInterface }))
                } catch {
                  // invalid JSON — ignore
                }
              }
            }}
            variant="default"
          >
            Convert JSON to TypeScript
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
        title="JSON to TypeScript"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex items-end gap-4">
            <FieldForm
              label="Root Name"
              name="root-name"
              onChange={handleRootNameChange}
              type="text"
              value={rootName}
            />
            <Button onClick={handleToggleInterface} type="button" variant="primary">
              {useInterface ? 'interface' : 'type'}
            </Button>
            <Button onClick={handleToggleOptional} type="button" variant="primary">
              optional?
            </Button>
            <Button onClick={handleGenerate} variant="primary">
              Generate
            </Button>
          </div>
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JSON Input"
                name="json-source"
                onChange={handleSourceChange}
                placeholder={'{\n  "name": "John",\n  "age": 30\n}'}
                type="code"
                value={source}
              />
            </div>
            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />
            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="text-body-xs font-medium text-gray-300">TypeScript Output</span>
                <CopyButton label="TypeScript" value={output} />
              </div>
              <pre className="min-h-[300px] grow overflow-auto rounded-lg border-2 border-gray-900 bg-gray-950 p-4 font-mono text-body-sm text-gray-200">
                {output || 'Paste JSON to generate TypeScript...'}
              </pre>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
