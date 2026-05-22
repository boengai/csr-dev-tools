import { CodeOutput, CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolComputationPersisted } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { formatJson } from '@/utils'
import { narrateParseError } from '@/utils/parse-error-narrators'

const toolEntry = TOOL_REGISTRY_MAP['json-formatter']

export const JsonFormatter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const {
    input: source,
    result,
    setInput,
    setInputImmediate,
  } = useToolComputationPersisted<string, string>({
    compute: async (val) => {
      const narrated = await narrateParseError('json', val)
      if (narrated != null) throw new Error(narrated)
      try {
        return await formatJson(val)
      } catch {
        throw new Error('Unable to format JSON')
      }
    },
    debounceMs: 300,
    errorFallback: 'Unable to format JSON',
    initial: '',
    initialResult: '',
    isEmpty: (val) => val.trim().length === 0,
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
        <SplitPanel>
          <Pane>
            <FieldForm
              label="JSON Input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder='{"name":"John","age":30,"tags":["dev","tools"]}'
              type="code"
              value={source}
            />
          </Pane>

          <Pane live>
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
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
