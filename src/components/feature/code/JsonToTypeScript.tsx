import { useEffect, useRef, useState } from 'react'

import { Button, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useToast, useToolComputation } from '@/hooks'
import type { JsonTsInput, ToolComponentProps } from '@/types'
import { jsonToTypeScript } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-typescript']

export const JsonToTypeScript = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [source, setSource] = useInputLocalStorage('csr-dev-tools-json-to-typescript-source', '')
  const [rootName, setRootName] = useState('Root')
  const [useInterface, setUseInterface] = useState(true)
  const [optionalProps, setOptionalProps] = useState(false)
  const { toast } = useToast()
  const initializedRef = useRef(false)

  const {
    result: output,
    setInput,
    setInputImmediate,
  } = useToolComputation<JsonTsInput, string>(
    ({ source: val, rootName: root, useInterface: iface, optionalProps: optional }) =>
      jsonToTypeScript(val, { optionalProperties: optional, rootName: root, useInterface: iface }),
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ source: val }) => !val.trim(),
    },
  )

  const handleGenerate = async () => {
    if (!source.trim()) {
      toast({ action: 'add', item: { label: 'Please enter JSON input', type: 'error' } })
      return
    }
    try {
      await jsonToTypeScript(source, { optionalProperties: optionalProps, rootName, useInterface })
      setInputImmediate({ source, rootName, useInterface, optionalProps })
      toast({ action: 'add', item: { label: 'TypeScript generated successfully', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Invalid JSON input', type: 'error' } })
    }
  }

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) setInputImmediate({ source, rootName, useInterface, optionalProps })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    setInput({ source: val, rootName, useInterface, optionalProps })
  }

  const handleRootNameChange = (val: string) => {
    setRootName(val)
    setInput({ source, rootName: val, useInterface, optionalProps })
  }

  const handleToggleInterface = () => {
    const next = !useInterface
    setUseInterface(next)
    setInputImmediate({ source, rootName, useInterface: next, optionalProps })
  }

  const handleToggleOptional = () => {
    const next = !optionalProps
    setOptionalProps(next)
    setInputImmediate({ source, rootName, useInterface, optionalProps: next })
  }

  const handleReset = () => {
    setRootName('Root')
    setUseInterface(true)
    setOptionalProps(false)
    setInputImmediate({ source, rootName: 'Root', useInterface: true, optionalProps: false })
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}
        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button
            block
            onClick={() => {
              setDialogOpen(true)
              if (source.trim()) {
                setInputImmediate({ source, rootName, useInterface, optionalProps })
              }
            }}
            variant="default"
          >
            Convert JSON to TypeScript
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
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
      </ToolDialogShell>
    </>
  )
}
