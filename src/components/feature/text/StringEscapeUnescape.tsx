import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { type EscapeMode, escapeString, unescapeString } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['string-escape-unescape']

const MODE_OPTIONS = [
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'URL', value: 'url' },
  { label: 'XML', value: 'xml' },
]

type Direction = 'escape' | 'unescape'
type EscapeInput = { direction: Direction; mode: EscapeMode; source: string }
const INITIAL_INPUT: EscapeInput = { direction: 'escape', mode: 'html', source: '' }

export const StringEscapeUnescape = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { showError } = useToast()

  const { inputs, reset, result, setFields, setFieldsImmediate } = useToolFields<EscapeInput, string>({
    compute: ({ direction: dir, mode: m, source: val }) =>
      dir === 'escape' ? escapeString(val, m) : unescapeString(val, m),
    debounceMs: 300,
    initial: INITIAL_INPUT,
    initialResult: '',
    isEmpty: ({ source: val }) => val.length === 0,
    onError: (_err, { direction: dir }) => {
      showError(`Unable to ${dir} — input contains invalid sequences`)
    },
  })

  const { direction, mode, source } = inputs

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title={direction === 'escape' ? 'String Escape' : 'String Unescape'}
      triggers={[
        { label: 'Escape', onOpen: () => setFieldsImmediate({ direction: 'escape', source: '' }) },
        { label: 'Unescape', onOpen: () => setFieldsImmediate({ direction: 'unescape', source: '' }) },
      ]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex items-center gap-3">
          <FieldForm
            label="Mode"
            name="mode"
            onChange={(val) => setFields({ mode: val as EscapeMode })}
            options={MODE_OPTIONS}
            type="select"
            value={mode}
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setFields({ direction: 'escape' })}
              variant={direction === 'escape' ? 'default' : 'primary'}
            >
              Escape
            </Button>
            <Button
              onClick={() => setFields({ direction: 'unescape' })}
              variant={direction === 'unescape' ? 'default' : 'primary'}
            >
              Unescape
            </Button>
          </div>
        </div>

        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="Source"
              name="dialog-source"
              onChange={(val) => setFields({ source: val })}
              placeholder="Enter text to escape or unescape..."
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
              placeholder="Result will appear here..."
              value={result}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
