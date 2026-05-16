import { CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputationPersisted } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { formatJson, getJsonParseError } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-formatter']

export const JsonFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { showError } = useToast()

  const { input: source, result, setInput, setInputImmediate } = useToolComputationPersisted<string, string>({
    compute: async (val) => {
      const parseError = await getJsonParseError(val)
      if (parseError != null) {
        throw new Error(`Invalid JSON: ${parseError}`)
      }
      try {
        return await formatJson(val)
      } catch {
        throw new Error('Unable to format JSON')
      }
    },
    debounceMs: 300,
    initial: '',
    initialResult: '',
    isEmpty: (val) => val.trim().length === 0,
    onError: (err) => {
      const label = err instanceof Error ? err.message : 'Unable to format JSON'
      showError(label)
    },
    storageKey: 'csr-dev-tools-json-formatter-source',
  })

  const handleSourceChange = (val: string) => setInput(val)

  const handleReset = () => setInputImmediate('')

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="JSON Format"
      triggers={[
        {
          label: 'Format',
          onOpen: () => {
            if (source.trim()) setInputImmediate(source)
          },
        },
      ]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="JSON Input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder='{"name":"John","age":30,"tags":["dev","tools"]}'
              type="code"
              value={source}
            />
          </div>

          <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>Formatted JSON</span>
                  <CopyButton label="formatted JSON" value={result} />
                </span>
              }
              placeholder={'{\n  "name": "John",\n  "age": 30\n}'}
              value={result}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
