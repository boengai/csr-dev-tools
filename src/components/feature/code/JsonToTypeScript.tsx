import { Button, CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
import type { JsonTsInput, ToolComponentProps } from '@/types'
import { jsonToTypeScript } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-typescript']

export const JsonToTypeScript = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const showError = useToast((s) => s.showError)
  const showSuccess = useToast((s) => s.showSuccess)

  const {
    inputs,
    recompute,
    result: output,
    setFields,
    setFieldsImmediate,
  } = useToolFields<JsonTsInput, string>({
    compute: ({ source: val, rootName: root, useInterface: iface, optionalProps: optional }) =>
      jsonToTypeScript(val, { optionalProperties: optional, rootName: root, useInterface: iface }),
    debounceMs: 300,
    initial: { source: '', rootName: 'Root', useInterface: true, optionalProps: false },
    initialResult: '',
    isEmpty: ({ source: val }) => !val.trim(),
    storageKey: 'csr-dev-tools-json-to-typescript',
  })
  const { source, rootName, useInterface, optionalProps } = inputs

  const handleGenerate = async () => {
    if (!source.trim()) {
      showError('Please enter JSON input')
      return
    }
    try {
      await jsonToTypeScript(source, { optionalProperties: optionalProps, rootName, useInterface })
      recompute()
      showSuccess('TypeScript generated successfully')
    } catch {
      showError('Invalid JSON input')
    }
  }

  const handleSourceChange = (val: string) => setFields({ source: val })
  const handleRootNameChange = (val: string) => setFields({ rootName: val })
  const handleToggleInterface = () => setFieldsImmediate({ useInterface: !useInterface })
  const handleToggleOptional = () => setFieldsImmediate({ optionalProps: !optionalProps })

  // Partial reset: clears the option fields back to defaults, preserves source.
  // The hook's reset() would also clear source, which is not the original behavior.
  const handleReset = () => setFieldsImmediate({ rootName: 'Root', useInterface: true, optionalProps: false })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      title="JSON to TypeScript"
      triggers={[
        {
          label: 'Convert JSON to TypeScript',
          onOpen: () => {
            if (source.trim()) recompute()
          },
        },
      ]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex items-end gap-4">
          <FieldForm label="Root Name" name="root-name" onChange={handleRootNameChange} type="text" value={rootName} />
          <Button onClick={handleToggleInterface} type="button" variant="primary">
            {useInterface ? 'interface' : 'type'}
          </Button>
          <Button onClick={handleToggleOptional} type="button" variant="primary">
            optional?
          </Button>
          <Button onClick={handleGenerate} variant="primary">
            Generate
          </Button>
        </div>
        <SplitPanel>
          <Pane>
            <FieldForm
              label="JSON Input"
              name="json-source"
              onChange={handleSourceChange}
              placeholder={'{\n  "name": "John",\n  "age": 30\n}'}
              type="code"
              value={source}
            />
          </Pane>
          <Pane live>
            <div className="flex items-center gap-1">
              <span className="text-body-xs font-medium text-gray-300">TypeScript Output</span>
              <CopyButton label="TypeScript" value={output} />
            </div>
            <pre className="min-h-[300px] grow overflow-auto rounded-lg border-2 border-gray-900 bg-gray-950 p-4 font-mono text-body-sm text-gray-200">
              {output || 'Paste JSON to generate TypeScript...'}
            </pre>
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
