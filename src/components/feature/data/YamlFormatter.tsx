import { CheckboxInput, FieldForm, FormatterShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps, YamlInput } from '@/types'
import { formatYaml } from '@/utils'
import { narrateParseError } from '@/utils/parse-error-narrators'

const toolEntry = TOOL_REGISTRY_MAP['yaml-formatter']

const INITIAL: YamlInput = { source: '', indent: 2, sortKeys: false }

const INDENT_OPTIONS = [
  { label: '2 spaces', value: '2' },
  { label: '4 spaces', value: '4' },
]

export const YamlFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  return (
    <FormatterShell<YamlInput>
      autoOpen={autoOpen}
      compute={async ({ source, indent, sortKeys }) => {
        const narrated = await narrateParseError('yaml', source)
        if (narrated != null) throw new Error(narrated)
        try {
          return await formatYaml(source, { indent, sortKeys })
        } catch {
          throw new Error('Unable to format YAML')
        }
      }}
      description={toolEntry?.description}
      initial={INITIAL}
      onAfterDialogClose={onAfterDialogClose}
      renderBanner={(error) =>
        error instanceof Error ? (
          <p className="text-body-sm text-error" role="alert">
            {error.message}
          </p>
        ) : null
      }
      renderControls={({ inputs, setFieldsImmediate }) => (
        <>
          <FieldForm
            label="Indent"
            name="indent"
            onChange={(val: string) => setFieldsImmediate({ indent: Number(val) })}
            options={INDENT_OPTIONS}
            type="select"
            value={String(inputs.indent)}
          />

          <label
            className="flex cursor-pointer items-center gap-2 pb-2 text-body-xs text-gray-400"
            htmlFor="yaml-sort-keys"
          >
            <CheckboxInput
              checked={inputs.sortKeys}
              id="yaml-sort-keys"
              onChange={() => setFieldsImmediate({ sortKeys: !inputs.sortKeys })}
            />
            Sort Keys
          </label>
        </>
      )}
      resultLabel="Formatted YAML"
      resultPlaceholder={'name: John\nage: 30\ntags:\n  - dev\n  - tools'}
      sourceLabel="YAML Input"
      sourcePlaceholder={'name: John\nage: 30\ntags:\n  - dev\n  - tools'}
      storageKey="csr-dev-tools-yaml-formatter"
      title="YAML Format"
      triggerLabel="Format"
    />
  )
}
