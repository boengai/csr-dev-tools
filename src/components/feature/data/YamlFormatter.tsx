import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CheckboxInput, CodeOutput, CopyButton, Dialog, FieldForm, SelectInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { formatYaml, getYamlParseError } from '@/utils/yaml'

const toolEntry = TOOL_REGISTRY_MAP['yaml-formatter']

const INDENT_OPTIONS = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 },
]

export const YamlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [indent, setIndent] = useState(2)
  const [sortKeys, setSortKeys] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const process = (val: string, currentIndent: number, currentSortKeys: boolean) => {
    if (val.trim().length === 0) {
      setResult('')
      return
    }

    const parseError = getYamlParseError(val)
    if (parseError != null) {
      setResult('')
      toast({ action: 'add', item: { label: `Invalid YAML: ${parseError}`, type: 'error' } })
      return
    }

    try {
      setResult(formatYaml(val, { indent: currentIndent, sortKeys: currentSortKeys }))
    } catch {
      setResult('')
      toast({ action: 'add', item: { label: 'Unable to format YAML', type: 'error' } })
    }
  }

  const processInput = useDebounceCallback((val: string, currentIndent: number, currentSortKeys: boolean) => {
    process(val, currentIndent, currentSortKeys)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val, indent, sortKeys)
  }

  const handleIndentChange = (val: string) => {
    const newIndent = Number(val)
    setIndent(newIndent)
    if (source.trim().length > 0) {
      process(source, newIndent, sortKeys)
    }
  }

  const handleSortKeysChange = () => {
    const newSortKeys = !sortKeys
    setSortKeys(newSortKeys)
    if (source.trim().length > 0) {
      process(source, indent, newSortKeys)
    }
  }

  const handleReset = () => {
    setSource('')
    setResult('')
    setIndent(2)
    setSortKeys(false)
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

            <label className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400">
              <CheckboxInput checked={sortKeys} onChange={() => handleSortKeysChange()} />
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
