import { useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useMountOnce, useToast, useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { formatJson, getJsonParseError } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-formatter']

export const JsonFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useInputLocalStorage('csr-dev-tools-json-formatter-source', '')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<string, string>(
    async (val) => {
      const parseError = await getJsonParseError(val)
      if (parseError != null) {
        throw new Error(`Invalid JSON: ${parseError}`)
      }
      try {
        return await formatJson(val)
      } catch {
        throw new Error('Unable to format JSON')
      }
    },
    {
      debounceMs: 300,
      initial: '',
      isEmpty: (val) => val.trim().length === 0,
      onError: (err) => {
        const label = err instanceof Error ? err.message : 'Unable to format JSON'
        toast({ action: 'add', item: { label, type: 'error' } })
      },
    },
  )

  useMountOnce(() => {
    if (source) setInputImmediate(source)
  })

  const handleSourceChange = (val: string) => {
    setSource(val)
    setInput(val)
  }

  const handleReset = () => {
    setInputImmediate('')
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
              if (source.trim()) setInputImmediate(source)
            }}
            variant="default"
          >
            Format
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title="JSON Format"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JSON Input"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder='{"name":"John","age":30,"tags":["dev","tools"]}'
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>Formatted JSON</span>
                    <CopyButton label="formatted JSON" value={result} />
                  </span>
                }
                placeholder={'{\n  "name": "John",\n  "age": 30\n}'}
                value={result}
              />
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
