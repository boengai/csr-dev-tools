import { Button, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFieldsPersisted } from '@/hooks'
import type { JsonTsInput, ToolComponentProps } from '@/types'
import { jsonToTypeScript } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-to-typescript']

export const JsonToTypeScript = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { showError, showSuccess } = useToast()

  const {
    inputs,
    recompute,
    result: output,
    setFields,
    setFieldsImmediate,
  } = useToolFieldsPersisted<JsonTsInput, string>({
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
      onAfterClose={onAfterDialogClose}
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
        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="JSON Input"
              name="json-source"
              onChange={handleSourceChange}
              placeholder={'{\n  "name": "John",\n  "age": 30\n}'}
              type="code"
              value={source}
            />
          </div>
          <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />
          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-body-xs font-medium text-gray-300">TypeScript Output</span>
              <CopyButton label="TypeScript" value={output} />
            </div>
            <pre className="min-h-[300px] grow overflow-auto rounded-lg border-2 border-gray-900 bg-gray-950 p-4 font-mono text-body-sm text-gray-200">
              {output || 'Paste JSON to generate TypeScript...'}
            </pre>
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
