import { useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { sortAndProcessText, type SortMode, type TextSortResult, tv } from '@/utils'

const toggleButtonStyles = tv({
  base: 'rounded border px-3 py-1 text-body-xs',
  variants: {
    active: {
      true: 'border-primary bg-primary/20 text-primary',
      false: 'border-gray-700 text-gray-500',
    },
  },
})

const toolEntry = TOOL_REGISTRY_MAP['text-sort-dedupe']

const SORT_OPTIONS = [
  { label: 'A → Z', value: 'az' },
  { label: 'Z → A', value: 'za' },
  { label: 'Length ↑', value: 'length-asc' },
  { label: 'Length ↓', value: 'length-desc' },
  { label: 'Numeric', value: 'numeric' },
]

type SortInput = {
  input: string
  removeDuplicates: boolean
  removeEmpty: boolean
  sortMode: SortMode
  trimLines: boolean
}

export const TextSortDedupe = (_props: ToolComponentProps) => {
  const [input, setInput] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('az')
  const [removeDuplicates, setRemoveDuplicates] = useState(false)
  const [removeEmpty, setRemoveEmpty] = useState(false)
  const [trimLines, setTrimLines] = useState(false)

  const { result, setInput: setComputeInput } = useToolComputation<SortInput, TextSortResult | null>(
    ({ input: text, removeDuplicates: dedup, removeEmpty: empty, sortMode: mode, trimLines: trim }) =>
      sortAndProcessText(text, { removeDuplicates: dedup, removeEmpty: empty, sortMode: mode, trimLines: trim }),
    {
      debounceMs: 300,
      initial: null,
      isEmpty: ({ input: text }) => !text.trim(),
    },
  )

  const handleInputChange = (val: string) => {
    setInput(val)
    setComputeInput({ input: val, removeDuplicates, removeEmpty, sortMode, trimLines })
  }

  const handleSortChange = (val: string) => {
    const mode = val as SortMode
    setSortMode(mode)
    setComputeInput({ input, removeDuplicates, removeEmpty, sortMode: mode, trimLines })
  }

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean,
    field: 'dedup' | 'empty' | 'trim',
  ) => {
    const next = !current
    setter(next)
    const opts = { dedup: removeDuplicates, empty: removeEmpty, trim: trimLines, [field]: next }
    setComputeInput({
      input,
      removeDuplicates: opts.dedup,
      removeEmpty: opts.empty,
      sortMode,
      trimLines: opts.trim,
    })
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

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
            className={toggleButtonStyles({ active: current })}
            key={field}
            onClick={() => toggle(setter, current, field)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {result && (
        <div aria-live="polite" className="flex flex-col gap-2">
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
