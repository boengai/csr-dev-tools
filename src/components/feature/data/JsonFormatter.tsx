import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { formatJson, getJsonParseError } from '@/utils/json'

const toolEntry = TOOL_REGISTRY_MAP['json-formatter']

export const JsonFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { clearError, error, setError } = useToolError()

  const process = (val: string) => {
    if (val.trim().length === 0) {
      setResult('')
      clearError()
      return
    }

    const parseError = getJsonParseError(val)
    if (parseError != null) {
      setResult('')
      setError(`Invalid JSON: ${parseError}`)
      return
    }

    try {
      setResult(formatJson(val))
      clearError()
    } catch {
      setResult('')
      setError('Unable to format JSON')
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val)
  }, 150)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleReset = () => {
    setSource('')
    setResult('')
    clearError()
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Format
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title="JSON Format"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="tablet:flex-row flex size-full grow flex-col gap-6">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JSON Input"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder='{"name":"John","age":30,"tags":["dev","tools"]}'
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="tablet:border-t-0 tablet:border-l-2 border-t-2 border-dashed border-gray-900" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                disabled={!result}
                label={
                  <span className="flex items-center gap-1">
                    <span>Formatted JSON</span>
                    <CopyButton label="formatted JSON" value={result} />
                  </span>
                }
                name="result"
                placeholder={'{\n  "name": "John",\n  "age": 30\n}'}
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
    </>
  )
}
