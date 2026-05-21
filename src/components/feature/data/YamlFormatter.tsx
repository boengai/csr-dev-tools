import { CheckboxInput, CodeOutput, CopyButton, FieldForm, Pane, SelectInput, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { ToolComponentProps, YamlInput } from '@/types'
import { formatYaml } from '@/utils'
import { narrateParseError } from '@/utils/parse-error-narrators'

const toolEntry = TOOL_REGISTRY_MAP['yaml-formatter']

const INDENT_OPTIONS = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 },
]

export const YamlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { showError } = useToast()

  const { inputs, result, reset, setFields, setFieldsImmediate } = useToolFields<YamlInput, string>({
    compute: async ({ source: val, indent: currentIndent, sortKeys: currentSortKeys }) => {
      const narrated = await narrateParseError('yaml', val)
      if (narrated != null) throw new Error(narrated)
      try {
        return await formatYaml(val, { indent: currentIndent, sortKeys: currentSortKeys })
      } catch {
        throw new Error('Unable to format YAML')
      }
    },
    debounceMs: 300,
    initial: { source: '', indent: 2, sortKeys: false },
    initialResult: '',
    isEmpty: ({ source: val }) => val.trim().length === 0,
    onError: (err) => {
      const label = err instanceof Error ? err.message : 'Unable to format YAML'
      showError(label)
    },
  })
  const { source, indent, sortKeys } = inputs

  const handleSourceChange = (val: string) => setFields({ source: val })
  const handleIndentChange = (val: string) => setFieldsImmediate({ indent: Number(val) })
  const handleSortKeysChange = () => setFieldsImmediate({ sortKeys: !sortKeys })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="YAML Format"
      triggers={[{ label: 'Format' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex items-center gap-4">
          <SelectInput
            name="indent-select"
            onChange={handleIndentChange}
            options={INDENT_OPTIONS.map((opt) => ({ label: opt.label, value: String(opt.value) }))}
            value={String(indent)}
          />

          <label className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400" htmlFor="yaml-sort-keys">
            <CheckboxInput checked={sortKeys} id="yaml-sort-keys" onChange={() => handleSortKeysChange()} />
            Sort Keys
          </label>
        </div>

        <SplitPanel>
          <Pane>
            <FieldForm
              label="YAML Input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder={'name: John\nage: 30\ntags:\n  - dev\n  - tools'}
              type="code"
              value={source}
            />
          </Pane>

          <Pane live>
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>Formatted YAML</span>
                  <CopyButton label="formatted YAML" value={result} />
                </span>
              }
              placeholder={'name: John\nage: 30\ntags:\n  - dev\n  - tools'}
              value={result}
            />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
