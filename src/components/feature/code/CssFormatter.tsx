import { CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { CssInput, ToolComponentProps } from '@/types'
import { formatCss, minifyCss } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['css-formatter']

export const CssFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { toast } = useToast()

  const { inputs, result, setFields, setFieldsImmediate } = useToolFields<CssInput, string>({
    compute: ({ source: val, mode: m, indent: ind }) => (m === 'beautify' ? formatCss(val, ind) : minifyCss(val)),
    debounceMs: 300,
    initial: { source: '', mode: 'beautify', indent: 2 },
    initialResult: '',
    isEmpty: ({ source: val }) => val.trim().length === 0,
    onError: () => {
      toast({ action: 'add', item: { label: 'Unable to format CSS', type: 'error' } })
    },
  })
  const { source, mode, indent } = inputs

  const handleSourceChange = (val: string) => setFields({ source: val })
  const handleModeChange = (val: string) => setFieldsImmediate({ mode: val as 'beautify' | 'minify' })
  const handleIndentChange = (val: string) => setFieldsImmediate({ indent: val === 'tab' ? 'tab' : Number(val) })
  const handleReset = () => setFieldsImmediate({ source: '' })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="CSS Formatter"
      triggers={[{ label: 'Format' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <FieldForm
            label="Mode"
            name="mode"
            onChange={handleModeChange}
            options={[
              { label: 'Beautify', value: 'beautify' },
              { label: 'Minify', value: 'minify' },
            ]}
            type="select"
            value={mode}
          />
          {mode === 'beautify' && (
            <FieldForm
              label="Indent"
              name="indent"
              onChange={handleIndentChange}
              options={[
                { label: '2 spaces', value: '2' },
                { label: '4 spaces', value: '4' },
                { label: 'Tab', value: 'tab' },
              ]}
              type="select"
              value={String(indent)}
            />
          )}
        </div>

        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="CSS Input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder="body { color: red; margin: 0; }"
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
              placeholder="Formatted CSS will appear here"
              value={result}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
