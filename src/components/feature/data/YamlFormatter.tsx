import { useReducer } from 'react'

import { Button, CheckboxInput, CodeOutput, CopyButton, Dialog, FieldForm, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { State, Action } from '@/types/components/feature/data/yamlFormatter'
import { formatYaml, getYamlParseError } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['yaml-formatter']

const INDENT_OPTIONS = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 },
]
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_INDENT':
      return { ...state, indent: action.payload }
    case 'SET_RESULT':
      return { ...state, result: action.payload }
    case 'SET_SORT_KEYS':
      return { ...state, sortKeys: action.payload }
    case 'SET_SOURCE':
      return { ...state, source: action.payload }
    case 'RESET':
      return { ...state, indent: 2, result: '', sortKeys: false, source: '' }
  }
}

export const YamlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, {
    dialogOpen: autoOpen ?? false,
    indent: 2,
    result: '',
    sortKeys: false,
    source: '',
  })
  const { dialogOpen, indent, result, sortKeys, source } = state
  const { toast } = useToast()

  const process = async (val: string, currentIndent: number, currentSortKeys: boolean) => {
    if (val.trim().length === 0) {
      dispatch({ type: 'SET_RESULT', payload: '' })
      return
    }

    const parseError = await getYamlParseError(val)
    if (parseError != null) {
      dispatch({ type: 'SET_RESULT', payload: '' })
      toast({ action: 'add', item: { label: `Invalid YAML: ${parseError}`, type: 'error' } })
      return
    }

    try {
      dispatch({
        type: 'SET_RESULT',
        payload: await formatYaml(val, { indent: currentIndent, sortKeys: currentSortKeys }),
      })
    } catch {
      dispatch({ type: 'SET_RESULT', payload: '' })
      toast({ action: 'add', item: { label: 'Unable to format YAML', type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string, currentIndent: number, currentSortKeys: boolean) => {
    process(val, currentIndent, currentSortKeys)
  }, 300)

  const handleSourceChange = (val: string) => {
    dispatch({ type: 'SET_SOURCE', payload: val })
    processInput(val, indent, sortKeys)
  }

  const handleIndentChange = (val: string) => {
    const newIndent = Number(val)
    dispatch({ type: 'SET_INDENT', payload: newIndent })
    if (source.trim().length > 0) {
      process(source, newIndent, sortKeys)
    }
  }

  const handleSortKeysChange = () => {
    const newSortKeys = !sortKeys
    dispatch({ type: 'SET_SORT_KEYS', payload: newSortKeys })
    if (source.trim().length > 0) {
      process(source, indent, newSortKeys)
    }
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
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
          <Button block onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })} variant="default">
            Format
          </Button>
        </div>
      </div>

      <Dialog
        injected={{
          open: dialogOpen,
          setOpen: (open: boolean) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open }),
        }}
        onAfterClose={handleAfterClose}
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
      </Dialog>
    </>
  )
}
