import { useReducer } from 'react'

import { Button, CheckboxInput, CodeOutput, CopyButton, FieldForm, SelectInput } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { ToolComponentProps, YamlFormatterAction, YamlFormatterState, YamlInput } from '@/types'
import { formatYaml, getYamlParseError } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['yaml-formatter']

const INDENT_OPTIONS = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 },
]

const reducer = (state: YamlFormatterState, action: YamlFormatterAction): YamlFormatterState => {
  switch (action.type) {
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_INDENT':
      return { ...state, indent: action.payload }
    case 'SET_SORT_KEYS':
      return { ...state, sortKeys: action.payload }
    case 'SET_SOURCE':
      return { ...state, source: action.payload }
    case 'RESET':
      return { ...state, indent: 2, sortKeys: false, source: '' }
  }
}

export const YamlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, {
    dialogOpen: autoOpen ?? false,
    indent: 2,
    sortKeys: false,
    source: '',
  })
  const { dialogOpen, indent, sortKeys, source } = state
  const { toast } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<YamlInput, string>(
    async ({ source: val, indent: currentIndent, sortKeys: currentSortKeys }) => {
      const parseError = await getYamlParseError(val)
      if (parseError != null) {
        throw new Error(`Invalid YAML: ${parseError}`)
      }
      try {
        return await formatYaml(val, { indent: currentIndent, sortKeys: currentSortKeys })
      } catch {
        throw new Error('Unable to format YAML')
      }
    },
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ source: val }) => val.trim().length === 0,
      onError: (err) => {
        const label = err instanceof Error ? err.message : 'Unable to format YAML'
        toast({ action: 'add', item: { label, type: 'error' } })
      },
    },
  )

  const handleSourceChange = (val: string) => {
    dispatch({ type: 'SET_SOURCE', payload: val })
    setInput({ source: val, indent, sortKeys })
  }

  const handleIndentChange = (val: string) => {
    const newIndent = Number(val)
    dispatch({ type: 'SET_INDENT', payload: newIndent })
    setInputImmediate({ source, indent: newIndent, sortKeys })
  }

  const handleSortKeysChange = () => {
    const newSortKeys = !sortKeys
    dispatch({ type: 'SET_SORT_KEYS', payload: newSortKeys })
    setInputImmediate({ source, indent, sortKeys: newSortKeys })
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
    setInputImmediate({ source: '', indent: 2, sortKeys: false })
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })} variant="default">
            Format
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={(open) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open })}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title="YAML Format"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex items-center gap-4">
            <SelectInput
              name="indent-select"
              onChange={handleIndentChange}
              options={INDENT_OPTIONS.map((opt) => ({ label: opt.label, value: String(opt.value) }))}
              value={String(indent)}
            />

            <label
              className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400"
              htmlFor="yaml-sort-keys"
            >
              <CheckboxInput checked={sortKeys} id="yaml-sort-keys" onChange={() => handleSortKeysChange()} />
              Sort Keys
            </label>
          </div>

          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="YAML Input"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={'name: John\nage: 30\ntags:\n  - dev\n  - tools'}
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>Formatted YAML</span>
                    <CopyButton label="formatted YAML" value={result} />
                  </span>
                }
                placeholder={'name: John\nage: 30\ntags:\n  - dev\n  - tools'}
                value={result}
              />
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
