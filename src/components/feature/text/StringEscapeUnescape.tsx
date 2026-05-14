import { useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type EscapeMode, escapeString, unescapeString } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['string-escape-unescape']

const MODE_OPTIONS = [
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'URL', value: 'url' },
  { label: 'XML', value: 'xml' },
]

type Direction = 'escape' | 'unescape'
type EscapeInput = { direction: Direction; mode: EscapeMode; source: string }

export const StringEscapeUnescape = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [mode, setMode] = useState<EscapeMode>('html')
  const [direction, setDirection] = useState<Direction>('escape')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<EscapeInput, string>(
    ({ direction: dir, mode: m, source: val }) =>
      dir === 'escape' ? escapeString(val, m) : unescapeString(val, m),
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ source: val }) => val.length === 0,
      onError: (_err, { direction: dir }) => {
        toast({
          action: 'add',
          item: {
            label: `Unable to ${dir} — input contains invalid sequences`,
            type: 'error',
          },
        })
      },
    },
  )

  const handleSourceChange = (val: string) => {
    setSource(val)
    setInput({ direction, mode, source: val })
  }

  const handleModeChange = (val: string) => {
    const newMode = val as EscapeMode
    setMode(newMode)
    setInput({ direction, mode: newMode, source })
  }

  const handleDirectionChange = (dir: Direction) => {
    setDirection(dir)
    setInput({ direction: dir, mode, source })
  }

  const openDialog = (dir: Direction) => {
    setDirection(dir)
    setSource('')
    setInputImmediate({ direction: dir, mode, source: '' })
    setDialogOpen(true)
  }

  const handleReset = () => {
    setSource('')
    setInputImmediate({ direction, mode, source: '' })
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('escape')} variant="default">
            Escape
          </Button>
          <Button block onClick={() => openDialog('unescape')} variant="default">
            Unescape
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
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
      </ToolDialogShell>
    </>
  )
}
