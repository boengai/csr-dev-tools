import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { formatCss, minifyCss } from '@/utils/css-format'

const toolEntry = TOOL_REGISTRY_MAP['css-formatter']

export const CssFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<'beautify' | 'minify'>('beautify')
  const [indent, setIndent] = useState<number | 'tab'>(2)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const process = (val: string, m: 'beautify' | 'minify', ind: number | 'tab') => {
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      setResult(m === 'beautify' ? formatCss(val, ind) : minifyCss(val))
    } catch {
      setResult('')
      toast({ action: 'add', item: { label: 'Unable to format CSS', type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode, indent)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleModeChange = (val: string) => {
    const m = val as 'beautify' | 'minify'
    setMode(m)
    if (source.trim().length > 0) {
      process(source, m, indent)
    }
  }

  const handleIndentChange = (val: string) => {
    const ind = val === 'tab' ? 'tab' : Number(val)
    setIndent(ind)
    if (source.trim().length > 0) {
      process(source, mode, ind)
    }
  }

  const handleReset = () => {
    setSource('')
    setResult('')
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

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
        title="CSS Formatter"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <FieldForm
              label="Mode"
              name="mode"
              onChange={handleModeChange}
              options={[
                { label: 'Beautify', value: 'beautify' },
                { label: 'Minify', value: 'minify' },
              ]}
              type="select"
              value={mode}
            />
            {mode === 'beautify' && (
              <FieldForm
                label="Indent"
                name="indent"
                onChange={handleIndentChange}
                options={[
                  { label: '2 spaces', value: '2' },
                  { label: '4 spaces', value: '4' },
                  { label: 'Tab', value: 'tab' },
                ]}
                type="select"
                value={String(indent)}
              />
            )}
          </div>

          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="CSS Input"
                lineNumbers
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="body { color: red; margin: 0; }"
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>Result</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder="Formatted CSS will appear here"
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
