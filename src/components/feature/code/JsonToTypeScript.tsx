import { FieldForm, ToggleButton, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { JsonTsInput, ToolComponentProps } from '@/types'
import { jsonToTypeScript } from '@/utils'
import { narrateParseError } from '@/utils/parse-error-narrators'

const toolEntry = TOOL_REGISTRY_MAP['json-to-typescript']

const INITIAL: JsonTsInput = { optionalProps: false, rootName: 'Root', source: '', useInterface: true }

export const JsonToTypeScript = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<JsonTsInput>
    autoOpen={autoOpen}
    compute={async ({ optionalProps, rootName, source, useInterface }) => {
      const narrated = await narrateParseError('json', source)
      if (narrated != null) throw new Error(narrated)
      try {
        return await jsonToTypeScript(source, {
          optionalProperties: optionalProps,
          rootName: rootName.trim() || 'Root',
          useInterface,
        })
      } catch {
        throw new Error('Unable to generate TypeScript from this JSON')
      }
    }}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    renderControls={({ inputs, setFields, setFieldsImmediate }) => (
      <>
        <div className="sm:w-48 w-full">
          <FieldForm
            label="Root Name"
            name="root-name"
            onChange={(val: string) => setFields({ rootName: val })}
            placeholder="Root"
            type="text"
            value={inputs.rootName}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleButton
            aria-label="Emit interface declarations"
            onClick={() => setFieldsImmediate({ useInterface: true })}
            pressed={inputs.useInterface}
          >
            interface
          </ToggleButton>
          <ToggleButton
            aria-label="Emit type aliases"
            onClick={() => setFieldsImmediate({ useInterface: false })}
            pressed={!inputs.useInterface}
          >
            type
          </ToggleButton>
          <ToggleButton
            aria-label="Make properties optional"
            onClick={() => setFieldsImmediate({ optionalProps: !inputs.optionalProps })}
            pressed={inputs.optionalProps}
          >
            optional?
          </ToggleButton>
        </div>
      </>
    )}
    resultLabel="TypeScript Output"
    resultPlaceholder="Paste JSON to generate TypeScript types"
    sourceLabel="JSON Input"
    sourcePlaceholder={'{\n  "name": "John",\n  "age": 30\n}'}
    storageKey="csr-dev-tools-json-to-typescript"
    title="JSON to TypeScript"
    triggerLabel="Convert JSON to TypeScript"
  />
)
