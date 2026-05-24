import { Button, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { parseUserAgent, type UserAgentResult } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['user-agent-parser']

const EMPTY: UserAgentResult = {
  browser: { name: '', version: '' },
  device: '',
  engine: { name: '', version: '' },
  os: { name: '', version: '' },
}

const ResultRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
    <span className="text-body-xs text-gray-400">{label}</span>
    <div className="flex items-center gap-1">
      <span className="font-mono text-body-xs text-gray-200">{value || '—'}</span>
      {value && <CopyButton label={label} value={value} />}
    </div>
  </div>
)

export const UserAgentParser = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { input, result, setInput, setInputImmediate } = useToolInput<string, UserAgentResult>({
    compute: (val) => parseUserAgent(val),
    debounceMs: 300,
    initial: '',
    initialResult: EMPTY,
    isEmpty: (val) => !val.trim(),
  })

  const handleUseMyUa = () => {
    if (typeof navigator !== 'undefined') {
      setInputImmediate(navigator.userAgent)
    }
  }

  const fmt = (name: string, version: string) => (version ? `${name} ${version}` : name)

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      title="User Agent Parser"
      triggers={[{ label: 'Parse' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex items-end gap-2">
          <div className="grow">
            <FieldForm
              label="User Agent String"
              name="ua-input"
              onChange={setInput}
              placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) ..."
              type="text"
              value={input}
            />
          </div>
          <Button onClick={handleUseMyUa} variant="primary">
            Use my UA
          </Button>
        </div>

        {result.browser.name && <div className="border-t-2 border-dashed border-gray-900" />}

        {result.browser.name && (
          <div className="flex flex-col gap-2">
            <ResultRow label="Browser" value={fmt(result.browser.name, result.browser.version)} />
            <ResultRow label="OS" value={fmt(result.os.name, result.os.version)} />
            <ResultRow label="Device" value={result.device} />
            <ResultRow label="Engine" value={fmt(result.engine.name, result.engine.version)} />
          </div>
        )}
      </div>
    </ToolDialogFrame>
  )
}
