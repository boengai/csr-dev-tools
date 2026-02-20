import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { UrlParseResult } from '@/utils/url-parse'

import { CopyButton, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import { parseUrl } from '@/utils/url-parse'

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

const ResultRow = ({ label, value, displayValue }: { label: string; value: string; displayValue?: string }) => {
  const display = displayValue ?? value
  if (!display) return null
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
      <span className="text-body-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-body-xs text-gray-200">{display}</span>
        {value && <CopyButton label={label} value={value} />}
      </div>
    </div>
  )
}

export const UrlParser = (_props: ToolComponentProps) => {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<UrlParseResult>(EMPTY)

  const process = useDebounceCallback((val: string) => {
    if (!val.trim()) {
      setResult(EMPTY)
      return
    }
    setResult(parseUrl(val))
  }, 300)

  const handleChange = (val: string) => {
    setInput(val)
    process(val)
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <FieldForm
        label="URL"
        name="url-input"
        onChange={handleChange}
        placeholder="https://example.com:8080/path?key=value#section"
        type="text"
        value={input}
      />

      {result.error && (
        <p className="text-red-500 text-body-xs" role="alert">
          {result.error}
        </p>
      )}

      {!result.error && result.hostname && (
        <div className="flex flex-col gap-2">
          <ResultRow label="Protocol" value={result.protocol} />
          <ResultRow label="Hostname" value={result.hostname} />
          <ResultRow label="Port" displayValue={result.port || 'default'} value={result.port} />
          <ResultRow label="Path" value={result.pathname} />
          <ResultRow label="Hash" value={result.hash} />

          {result.searchParams.length > 0 && (
            <div className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 p-3">
              <div className="flex items-center justify-between">
                <span className="text-body-xs font-medium text-gray-400">Query Parameters</span>
                <CopyButton label="Query String" value={result.search} />
              </div>
              {result.searchParams.map((param, i) => (
                <div className="flex items-center justify-between gap-2 py-1" key={i}>
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
  )
}
