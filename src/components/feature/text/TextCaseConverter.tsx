import { CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { CaseResult, ToolComponentProps } from '@/types'
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
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['text-case-converter']
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
  const {
    input: source,
    result: results,
    setInput,
    reset,
  } = useToolInput<string, Array<{ label: string; value: string }>>({
    compute: (val) => CASES.map((c) => ({ label: c.label, value: c.fn(val) })),
    debounceMs: 300,
    initial: '',
    initialResult: [],
    isEmpty: (val) => val.length === 0,
  })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="Text Case Converter"
      triggers={[{ label: 'Convert Text Case' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="Source"
              name="dialog-source"
              onChange={setInput}
              placeholder="Enter text to convert..."
              rows={12}
              type="textarea"
              value={source}
            />
          </Pane>

          <Pane live scroll>
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
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
