import { useMemo, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { formatJs, minifyJs } from '@/utils/js-format'

const toolEntry = TOOL_REGISTRY_MAP['javascript-minifier']

export const JavaScriptMinifier = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<'beautify' | 'minify'>('minify')
  const [indent, setIndent] = useState<number | 'tab'>(2)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const process = (val: string, m: 'beautify' | 'minify', ind: number | 'tab') => {
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      setResult(m === 'beautify' ? formatJs(val, ind) : minifyJs(val))
    } catch {
      setResult('')
      toast({ action: 'add', item: { label: 'Unable to process JavaScript', type: 'error' } })
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

  const originalSize = useMemo(() => new Blob([source]).size, [source])
  const resultSize = useMemo(() => new Blob([result]).size, [result])
  const savings = originalSize > 0 ? ((1 - resultSize / originalSize) * 100).toFixed(1) : '0'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Minify / Beautify
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title="JavaScript Minifier"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <FieldForm
              label="Mode"
              name="mode"
              onChange={handleModeChange}
              options={[
                { label: 'Minify', value: 'minify' },
                { label: 'Beautify', value: 'beautify' },
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
            {result && (
              <p className="text-body-xs text-gray-500">
                {originalSize} B → {resultSize} B ({savings}% savings)
              </p>
            )}
          </div>

          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JavaScript Input"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="function hello() { return 'world'; }"
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
                    <span>Result</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                name="result"
                placeholder="Processed JavaScript will appear here"
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
