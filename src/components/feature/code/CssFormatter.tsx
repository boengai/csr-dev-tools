import { FieldForm, FormatterShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CssInput, ToolComponentProps } from '@/types'
import { formatCss, minifyCss } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['css-formatter']

const INITIAL: CssInput = { source: '', mode: 'beautify', indent: 2 }

export const CssFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  return (
    <FormatterShell<CssInput>
      autoOpen={autoOpen}
      compute={({ source, mode, indent }) => (mode === 'beautify' ? formatCss(source, indent) : minifyCss(source))}
      description={toolEntry?.description}
      errorLabel="Unable to format CSS"
      initial={INITIAL}
      onAfterDialogClose={onAfterDialogClose}
      renderControls={({ inputs, setFieldsImmediate }) => (
        <>
          <FieldForm
            label="Mode"
            name="mode"
            onChange={(val: string) => setFieldsImmediate({ mode: val as CssInput['mode'] })}
            options={[
              { label: 'Beautify', value: 'beautify' },
              { label: 'Minify', value: 'minify' },
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
        </>
      )}
      resultPlaceholder="Formatted CSS will appear here"
      sourceLabel="CSS Input"
      sourcePlaceholder="body { color: red; margin: 0; }"
      storageKey="csr-dev-tools-css-formatter"
      title="CSS Formatter"
      triggerLabel="Format"
    />
  )
}
