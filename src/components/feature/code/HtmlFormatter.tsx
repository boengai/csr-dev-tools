import { useState } from 'react'

import { CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useMountOnce, useToast, useToolComputation } from '@/hooks'
import type { HtmlInput, ToolComponentProps } from '@/types'
import { formatHtml, minifyHtml } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['html-formatter']

export const HtmlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useInputLocalStorage('csr-dev-tools-html-formatter-source', '')
  const [mode, setMode] = useState<'beautify' | 'minify'>('beautify')
  const [indent, setIndent] = useState<number | 'tab'>(2)
  const { toast } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<HtmlInput, string>(
    ({ source: val, mode: m, indent: ind }) => (m === 'beautify' ? formatHtml(val, ind) : minifyHtml(val)),
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ source: val }) => val.trim().length === 0,
      onError: () => {
        toast({ action: 'add', item: { label: 'Unable to format HTML', type: 'error' } })
      },
    },
  )

  useMountOnce(() => {
    if (source) setInputImmediate({ source, mode, indent })
  })

  const handleSourceChange = (val: string) => {
    setSource(val)
    setInput({ source: val, mode, indent })
  }

  const handleModeChange = (val: string) => {
    const m = val as 'beautify' | 'minify'
    setMode(m)
    setInputImmediate({ source, mode: m, indent })
  }

  const handleIndentChange = (val: string) => {
    const ind = val === 'tab' ? 'tab' : Number(val)
    setIndent(ind)
    setInputImmediate({ source, mode, indent: ind })
  }

  const handleReset = () => {
    setInputImmediate({ source: '', mode, indent })
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="HTML Formatter"
      triggers={[
        {
          label: 'Format',
          onOpen: () => {
            if (source.trim()) setInputImmediate({ source, mode, indent })
          },
        },
      ]}
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
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="HTML Input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder="<div><p>Hello World</p></div>"
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
              placeholder="Formatted HTML will appear here"
              value={result}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
