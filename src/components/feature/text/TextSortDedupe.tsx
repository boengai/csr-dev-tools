import { FieldForm, ToggleButton, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { TextSortInput, ToolComponentProps } from '@/types'
import { type SortMode, sortAndProcessText } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['text-sort-dedupe']

const SORT_OPTIONS = [
  { label: 'A → Z', value: 'az' },
  { label: 'Z → A', value: 'za' },
  { label: 'Length ↑', value: 'length-asc' },
  { label: 'Length ↓', value: 'length-desc' },
  { label: 'Numeric', value: 'numeric' },
]

const TOGGLES = [
  { field: 'removeDuplicates', label: 'Dedupe' },
  { field: 'removeEmpty', label: 'No Empty' },
  { field: 'trimLines', label: 'Trim' },
] as const

const INITIAL: TextSortInput = {
  removeDuplicates: false,
  removeEmpty: false,
  sortMode: 'az',
  source: '',
  trimLines: false,
}

const countLines = (text: string) => text.replace(/\r\n/g, '\n').split('\n').length

export const TextSortDedupe = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<TextSortInput>
    autoOpen={autoOpen}
    compute={({ removeDuplicates, removeEmpty, sortMode, source, trimLines }) =>
      sortAndProcessText(source, { removeDuplicates, removeEmpty, sortMode, trimLines }).output
    }
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    renderControls={({ inputs, result, setFieldsImmediate }) => (
      <>
        <FieldForm
          label="Sort"
          name="sort-mode"
          onChange={(val: string) => setFieldsImmediate({ sortMode: val as SortMode })}
          options={SORT_OPTIONS}
          type="select"
          value={inputs.sortMode}
        />
        <div className="flex flex-wrap items-center gap-2">
          {TOGGLES.map(({ field, label }) => (
            <ToggleButton
              key={field}
              onClick={() => setFieldsImmediate({ [field]: !inputs[field] })}
              pressed={inputs[field]}
              variant="subtle"
            >
              {label}
            </ToggleButton>
          ))}
        </div>
        {result !== '' && (
          <span className="flex min-h-10 items-center text-body-xs text-gray-400">
            {countLines(inputs.source)} → {countLines(result)} lines
          </span>
        )}
      </>
    )}
    resultLabel="Sorted lines"
    resultPlaceholder="Paste lines to sort and dedupe them"
    sourceKind="textarea"
    sourceLabel="Input (one item per line)"
    sourcePlaceholder={'banana\napple\ncherry\napple'}
    storageKey="csr-dev-tools-text-sort-dedupe"
    title="Text Sort & Dedupe"
    triggerLabel="Sort"
  />
)
