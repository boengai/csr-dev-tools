import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { EscapeMode } from '@/utils/string-escape'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { escapeString, unescapeString } from '@/utils/string-escape'

const toolEntry = TOOL_REGISTRY_MAP['string-escape-unescape']

const MODE_OPTIONS = [
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'URL', value: 'url' },
  { label: 'XML', value: 'xml' },
]

export const StringEscapeUnescape = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<EscapeMode>('html')
  const [direction, setDirection] = useState<'escape' | 'unescape'>('escape')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const process = (val: string, m: EscapeMode, dir: 'escape' | 'unescape') => {
    if (val.length === 0) {
      setResult('')
      return
    }
    try {
      setResult(dir === 'escape' ? escapeString(val, m) : unescapeString(val, m))
    } catch {
      setResult('')
      toast({
        action: 'add',
        item: {
          label: `Unable to ${dir} — input contains invalid sequences`,
          type: 'error',
        },
      })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode, direction)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleModeChange = (val: string) => {
    const newMode = val as EscapeMode
    setMode(newMode)
    if (source.length > 0) {
      process(source, newMode, direction)
    }
  }

  const handleDirectionChange = (dir: 'escape' | 'unescape') => {
    setDirection(dir)
    if (source.length > 0) {
      process(source, mode, dir)
    }
  }

  const openDialog = (dir: 'escape' | 'unescape') => {
    setDirection(dir)
    setSource('')
    setResult('')
    setDialogOpen(true)
  }

  const handleReset = () => {
    setSource('')
    setResult('')
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('escape')} variant="default">
            Escape
          </Button>
          <Button block onClick={() => openDialog('unescape')} variant="default">
            Unescape
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={onAfterDialogClose ?? handleReset}
        size="screen"
        title={direction === 'escape' ? 'String Escape' : 'String Unescape'}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex items-center gap-3">
            <FieldForm
              label="Mode"
              name="mode"
              onChange={handleModeChange}
              options={MODE_OPTIONS}
              type="select"
              value={mode}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDirectionChange('escape')}
                variant={direction === 'escape' ? 'default' : 'primary'}
              >
                Escape
              </Button>
              <Button
                onClick={() => handleDirectionChange('unescape')}
                variant={direction === 'unescape' ? 'default' : 'primary'}
              >
                Unescape
              </Button>
            </div>
          </div>

          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Source"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="Enter text to escape or unescape..."
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>Result</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder="Result will appear here..."
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
