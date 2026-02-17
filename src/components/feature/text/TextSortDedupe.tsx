import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { SortMode, TextSortResult } from '@/utils/text-sort'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import { sortAndProcessText } from '@/utils/text-sort'

const toolEntry = TOOL_REGISTRY_MAP['text-sort-dedupe']

const SORT_OPTIONS = [
  { label: 'A → Z', value: 'az' },
  { label: 'Z → A', value: 'za' },
  { label: 'Length ↑', value: 'length-asc' },
  { label: 'Length ↓', value: 'length-desc' },
  { label: 'Numeric', value: 'numeric' },
]

export const TextSortDedupe = (_props: ToolComponentProps) => {
  const [input, setInput] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('az')
  const [removeDuplicates, setRemoveDuplicates] = useState(false)
  const [removeEmpty, setRemoveEmpty] = useState(false)
  const [trimLines, setTrimLines] = useState(false)
  const [result, setResult] = useState<TextSortResult | null>(null)

  const processImmediate = (text: string, mode: SortMode, dedup: boolean, empty: boolean, trim: boolean) => {
    if (!text.trim()) {
      setResult(null)
      return
    }
    setResult(
      sortAndProcessText(text, { removeDuplicates: dedup, removeEmpty: empty, sortMode: mode, trimLines: trim }),
    )
  }

  const processDebounced = useDebounceCallback(processImmediate, 300)

  const handleInputChange = (val: string) => {
    setInput(val)
    processDebounced(val, sortMode, removeDuplicates, removeEmpty, trimLines)
  }

  const handleSortChange = (val: string) => {
    const mode = val as SortMode
    setSortMode(mode)
    processImmediate(input, mode, removeDuplicates, removeEmpty, trimLines)
  }

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean,
    field: 'dedup' | 'empty' | 'trim',
  ) => {
    const next = !current
    setter(next)
    const opts = { dedup: removeDuplicates, empty: removeEmpty, trim: trimLines, [field]: next }
    processImmediate(input, sortMode, opts.dedup, opts.empty, opts.trim)
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <FieldForm
        label="Input (one item per line)"
        name="sort-input"
        onChange={handleInputChange}
        placeholder="banana\napple\ncherry\napple"
        rows={8}
        type="textarea"
        value={input}
      />

      <div className="flex flex-wrap items-center gap-3">
        <FieldForm
          label="Sort"
          name="sort-mode"
          onChange={handleSortChange}
          options={SORT_OPTIONS}
          type="select"
          value={sortMode}
        />
        {[
          { current: removeDuplicates, field: 'dedup' as const, label: 'Dedupe', setter: setRemoveDuplicates },
          { current: removeEmpty, field: 'empty' as const, label: 'No Empty', setter: setRemoveEmpty },
          { current: trimLines, field: 'trim' as const, label: 'Trim', setter: setTrimLines },
        ].map(({ current, field, label, setter }) => (
          <button
            className={`rounded border px-3 py-1 text-body-xs ${current ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-500'}`}
            key={field}
            onClick={() => toggle(setter, current, field)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {result && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-body-xs text-gray-400">
              {result.lineCountBefore} → {result.lineCountAfter} lines
            </span>
            <CopyButton label="result" value={result.output} />
          </div>
          <pre className="max-h-[300px] overflow-auto rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-body-sm text-gray-200">
            {result.output}
          </pre>
        </div>
      )}
    </div>
  )
}
