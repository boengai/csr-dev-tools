import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import {
  toCamelCase,
  toConstantCase,
  toDotCase,
  toKebabCase,
  toLowerCase,
  toPathCase,
  toPascalCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toUpperCase,
} from '@/utils/text-case'

const toolEntry = TOOL_REGISTRY_MAP['text-case-converter']

type CaseResult = {
  fn: (input: string) => string
  label: string
}

const CASES: Array<CaseResult> = [
  { fn: toCamelCase, label: 'camelCase' },
  { fn: toPascalCase, label: 'PascalCase' },
  { fn: toSnakeCase, label: 'snake_case' },
  { fn: toKebabCase, label: 'kebab-case' },
  { fn: toConstantCase, label: 'CONSTANT_CASE' },
  { fn: toTitleCase, label: 'Title Case' },
  { fn: toSentenceCase, label: 'Sentence case' },
  { fn: toUpperCase, label: 'UPPERCASE' },
  { fn: toLowerCase, label: 'lowercase' },
  { fn: toDotCase, label: 'dot.case' },
  { fn: toPathCase, label: 'path/case' },
]

export const TextCaseConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [results, setResults] = useState<Array<{ label: string; value: string }>>([])
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  const processInput = useDebounceCallback((val: string) => {
    if (val.length === 0) {
      setResults([])
      return
    }
    setResults(CASES.map((c) => ({ label: c.label, value: c.fn(val) })))
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleReset = () => {
    setSource('')
    setResults([])
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Convert Text Case
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={onAfterDialogClose ?? handleReset}
        size="screen"
        title="Text Case Converter"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Source"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="Enter text to convert..."
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-auto">
              <span className="text-body-sm font-medium text-gray-400">Results</span>
              {results.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {results.map((r) => (
                    <div className="flex flex-col gap-1" key={r.label}>
                      <span className="flex items-center gap-1">
                        <span className="text-body-xs font-medium text-gray-500">{r.label}</span>
                        <CopyButton label={r.label} value={r.value} />
                      </span>
                      <span className="text-sm rounded-lg border border-gray-800 bg-gray-950 p-2 font-mono break-all text-gray-300">
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-body-xs text-gray-600">Enter text to see conversions</span>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
