import { useReducer } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { formatJs, minifyJs } from '@/utils/js-format'

type State = {
  dialogOpen: boolean
  indent: number | 'tab'
  mode: 'beautify' | 'minify'
  result: string
  source: string
}

type Action =
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_INDENT'; payload: number | 'tab' }
  | { type: 'SET_MODE'; payload: 'beautify' | 'minify' }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'SET_SOURCE'; payload: string }
  | { type: 'RESET' }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_INDENT':
      return { ...state, indent: action.payload }
    case 'SET_MODE':
      return { ...state, mode: action.payload }
    case 'SET_RESULT':
      return { ...state, result: action.payload }
    case 'SET_SOURCE':
      return { ...state, source: action.payload }
    case 'RESET':
      return { ...state, result: '', source: '' }
  }
}

const toolEntry = TOOL_REGISTRY_MAP['javascript-minifier']

export const JavaScriptMinifier = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, {
    dialogOpen: autoOpen ?? false,
    indent: 2,
    mode: 'minify',
    result: '',
    source: '',
  })
  const { dialogOpen, indent, mode, result, source } = state
  const { toast } = useToast()

  const process = (val: string, m: 'beautify' | 'minify', ind: number | 'tab') => {
    if (val.trim().length === 0) {
      dispatch({ type: 'SET_RESULT', payload: '' })
      return
    }
    try {
      dispatch({ type: 'SET_RESULT', payload: m === 'beautify' ? formatJs(val, ind) : minifyJs(val) })
    } catch {
      dispatch({ type: 'SET_RESULT', payload: '' })
      toast({ action: 'add', item: { label: 'Unable to process JavaScript', type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode, indent)
  }, 300)

  const handleSourceChange = (val: string) => {
    dispatch({ type: 'SET_SOURCE', payload: val })
    processInput(val)
  }

  const handleModeChange = (val: string) => {
    const m = val as 'beautify' | 'minify'
    dispatch({ type: 'SET_MODE', payload: m })
    if (source.trim().length > 0) {
      process(source, m, indent)
    }
  }

  const handleIndentChange = (val: string) => {
    const ind = val === 'tab' ? 'tab' : Number(val)
    dispatch({ type: 'SET_INDENT', payload: ind })
    if (source.trim().length > 0) {
      process(source, mode, ind)
    }
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  const originalSize = new Blob([source]).size
  const resultSize = new Blob([result]).size
  const savings = originalSize > 0 ? ((1 - resultSize / originalSize) * 100).toFixed(1) : '0'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })} variant="default">
            Minify / Beautify
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: (open: boolean) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open }) }}
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
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JavaScript Input"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="function hello() { return 'world'; }"
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
                placeholder="Processed JavaScript will appear here"
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
