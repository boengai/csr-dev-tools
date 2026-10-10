import { CopyButton, ErrorBanner, FieldForm, InlineLabeledRow } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { parseUrl, type UrlParseResult } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['url-parser']

const EMPTY: UrlParseResult = {
  hash: '',
  hostname: '',
  pathname: '',
  port: '',
  protocol: '',
  search: '',
  searchParams: [],
}

export const UrlParser = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const { input, result, setInput } = useToolInput<string, UrlParseResult>({
    compute: (val) => parseUrl(val),
    debounceMs: 300,
    initial: '',
    initialResult: EMPTY,
    isEmpty: (val) => !val.trim(),
  })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      title="URL Parser"
      triggers={[{ label: 'Parse' }]}
    >
      <div className="flex w-full grow flex-col items-center gap-4">
        <FieldForm
          label="URL"
          name="url-input"
          onChange={setInput}
          placeholder="https://example.com:8080/path?key=value#section"
          type="text"
          value={input}
        />

        {result.error && <ErrorBanner>{result.error}</ErrorBanner>}

        {!result.error && result.hostname && (
          <div className="flex flex-col gap-2">
            <InlineLabeledRow label="Protocol" value={result.protocol} />
            <InlineLabeledRow label="Hostname" value={result.hostname} />
            <InlineLabeledRow label="Port" displayValue={result.port || 'default'} value={result.port} />
            <InlineLabeledRow label="Path" value={result.pathname} />
            <InlineLabeledRow label="Hash" value={result.hash} />

            {result.searchParams.length > 0 && (
              <div className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-xs font-medium text-gray-400">Query Parameters</span>
                  <CopyButton label="Query String" value={result.search} />
                </div>
                {result.searchParams.map((param) => (
                  <div className="flex items-center justify-between gap-2 py-1" key={`${param.key}=${param.value}`}>
                    <span className="font-mono text-body-xs text-primary-light">{param.key}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-body-xs text-gray-200">{param.value}</span>
                      <CopyButton label={param.key} value={param.value} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolDialogFrame>
  )
}
