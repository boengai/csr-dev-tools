import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolFields } from '@/hooks'
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

const INITIAL_INPUT: SortInput = {
  input: '',
  removeDuplicates: false,
  removeEmpty: false,
  sortMode: 'az',
  trimLines: false,
}

export const TextSortDedupe = (_props: ToolComponentProps) => {
  const { inputs, result, setFields } = useToolFields<SortInput, TextSortResult | null>({
    compute: ({ input: text, removeDuplicates: dedup, removeEmpty: empty, sortMode: mode, trimLines: trim }) =>
      sortAndProcessText(text, { removeDuplicates: dedup, removeEmpty: empty, sortMode: mode, trimLines: trim }),
    debounceMs: 300,
    initial: INITIAL_INPUT,
    initialResult: null,
    isEmpty: ({ input: text }) => !text.trim(),
  })

  const { input, removeDuplicates, removeEmpty, sortMode, trimLines } = inputs

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <FieldForm
        label="Input (one item per line)"
        name="sort-input"
        onChange={(val) => setFields({ input: val })}
        placeholder="banana\napple\ncherry\napple"
        rows={8}
        type="textarea"
        value={input}
      />

      <div className="flex flex-wrap items-center gap-3">
        <FieldForm
          label="Sort"
          name="sort-mode"
          onChange={(val) => setFields({ sortMode: val as SortMode })}
          options={SORT_OPTIONS}
          type="select"
          value={sortMode}
        />
        {[
          { current: removeDuplicates, field: 'removeDuplicates' as const, label: 'Dedupe' },
          { current: removeEmpty, field: 'removeEmpty' as const, label: 'No Empty' },
          { current: trimLines, field: 'trimLines' as const, label: 'Trim' },
        ].map(({ current, field, label }) => (
          <button
            className={toggleButtonStyles({ active: current })}
            key={field}
            onClick={() => setFields({ [field]: !current } as Partial<SortInput>)}
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
