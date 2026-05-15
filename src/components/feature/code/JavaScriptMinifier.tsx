import { CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { JsInput, ToolComponentProps } from '@/types'
import { formatJs, minifyJs } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['javascript-minifier']

export const JavaScriptMinifier = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { toast } = useToast()

  const { inputs, result, setFields, setFieldsImmediate } = useToolFields<JsInput, string>({
    compute: ({ source: val, mode: m, indent: ind }) => (m === 'beautify' ? formatJs(val, ind) : minifyJs(val)),
    debounceMs: 300,
    initial: { source: '', mode: 'minify', indent: 2 },
    initialResult: '',
    isEmpty: ({ source: val }) => val.trim().length === 0,
    onError: () => {
      toast({ action: 'add', item: { label: 'Unable to process JavaScript', type: 'error' } })
    },
  })
  const { indent, mode, source } = inputs

  const handleSourceChange = (val: string) => setFields({ source: val })
  const handleModeChange = (val: string) => setFieldsImmediate({ mode: val as 'beautify' | 'minify' })
  const handleIndentChange = (val: string) => setFieldsImmediate({ indent: val === 'tab' ? 'tab' : Number(val) })
  const handleReset = () => setFieldsImmediate({ source: '' })

  const originalSize = new Blob([source]).size
  const resultSize = new Blob([result]).size
  const savings = originalSize > 0 ? ((1 - resultSize / originalSize) * 100).toFixed(1) : '0'

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="JavaScript Minifier"
      triggers={[{ label: 'Minify / Beautify' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <FieldForm
            label="Mode"
            name="mode"
            onChange={handleModeChange}
            options={[
              { label: 'Minify', value: 'minify' },
              { label: 'Beautify', value: 'beautify' },
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
          {result && (
            <p className="text-body-xs text-gray-500">
              {originalSize} B → {resultSize} B ({savings}% savings)
            </p>
          )}
        </div>

        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="JavaScript Input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder="function hello() { return 'world'; }"
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
              placeholder="Processed JavaScript will appear here"
              value={result}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
