import { FieldForm, FormatterShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { JsInput, ToolComponentProps } from '@/types'
import { formatJs, minifyJs } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['javascript-minifier']

const INITIAL: JsInput = { source: '', mode: 'minify', indent: 2 }

export const JavaScriptMinifier = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  return (
    <FormatterShell<JsInput>
      autoOpen={autoOpen}
      compute={({ source, mode, indent }) => (mode === 'beautify' ? formatJs(source, indent) : minifyJs(source))}
      description={toolEntry?.description}
      errorLabel="Unable to process JavaScript"
      initial={INITIAL}
      onAfterDialogClose={onAfterDialogClose}
      renderControls={({ inputs, result, setFieldsImmediate }) => {
        const originalSize = new Blob([inputs.source]).size
        const resultSize = new Blob([result]).size
        const savings = originalSize > 0 ? ((1 - resultSize / originalSize) * 100).toFixed(1) : '0'
        return (
          <>
            <FieldForm
              label="Mode"
              name="mode"
              onChange={(val: string) => setFieldsImmediate({ mode: val as JsInput['mode'] })}
              options={[
                { label: 'Minify', value: 'minify' },
                { label: 'Beautify', value: 'beautify' },
              ]}
              type="select"
              value={inputs.mode}
            />
            {inputs.mode === 'beautify' && (
              <FieldForm
                label="Indent"
                name="indent"
                onChange={(val: string) => setFieldsImmediate({ indent: val === 'tab' ? 'tab' : Number(val) })}
                options={[
                  { label: '2 spaces', value: '2' },
                  { label: '4 spaces', value: '4' },
                  { label: 'Tab', value: 'tab' },
                ]}
                type="select"
                value={String(inputs.indent)}
              />
            )}
            {result && (
              <p className="text-body-xs text-gray-500">
                {originalSize} B → {resultSize} B ({savings}% savings)
              </p>
            )}
          </>
        )
      }}
      resultPlaceholder="Processed JavaScript will appear here"
      sourceLabel="JavaScript Input"
      sourcePlaceholder="function hello() { return 'world'; }"
      storageKey="csr-dev-tools-javascript-minifier"
      title="JavaScript Minifier"
      triggerLabel="Minify / Beautify"
    />
  )
}
