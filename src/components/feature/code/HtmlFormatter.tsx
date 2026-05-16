import { FieldForm, FormatterShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { HtmlInput, ToolComponentProps } from '@/types'
import { formatHtml, minifyHtml } from '@/wasm/formatter'

const toolEntry = TOOL_REGISTRY_MAP['html-formatter']

const INITIAL: HtmlInput = { source: '', mode: 'beautify', indent: 2 }

export const HtmlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  return (
    <FormatterShell<HtmlInput>
      autoOpen={autoOpen}
      compute={({ source, mode, indent }) => (mode === 'beautify' ? formatHtml(source, indent) : minifyHtml(source))}
      description={toolEntry?.description}
      errorLabel="Unable to format HTML"
      initial={INITIAL}
      onAfterDialogClose={onAfterDialogClose}
      renderControls={({ inputs, setFieldsImmediate }) => (
        <>
          <FieldForm
            label="Mode"
            name="mode"
            onChange={(val: string) => setFieldsImmediate({ mode: val as HtmlInput['mode'] })}
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
      resultPlaceholder="Formatted HTML will appear here"
      sourceLabel="HTML Input"
      sourcePlaceholder="<div><p>Hello World</p></div>"
      storageKey="csr-dev-tools-html-formatter"
      title="HTML Formatter"
      triggerLabel="Format"
    />
  )
}
