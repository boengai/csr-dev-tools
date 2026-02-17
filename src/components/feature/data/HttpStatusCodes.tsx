import { useMemo, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { HttpStatusCategory } from '@/utils/http-status'

import { FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { filterHttpStatusCodes, HTTP_STATUS_CODES } from '@/utils/http-status'

const toolEntry = TOOL_REGISTRY_MAP['http-status-codes']

const CATEGORIES: Array<{ label: string; value: HttpStatusCategory | '' }> = [
  { label: 'All', value: '' },
  { label: '1xx', value: '1xx Informational' },
  { label: '2xx', value: '2xx Success' },
  { label: '3xx', value: '3xx Redirection' },
  { label: '4xx', value: '4xx Client Error' },
  { label: '5xx', value: '5xx Server Error' },
]

const CATEGORY_COLORS: Record<string, string> = {
  '1xx Informational': 'text-gray-400',
  '2xx Success': 'text-green-400',
  '3xx Redirection': 'text-blue-400',
  '4xx Client Error': 'text-yellow-400',
  '5xx Server Error': 'text-red-400',
}

export const HttpStatusCodes = (_props: ToolComponentProps) => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<HttpStatusCategory | ''>('')

  const filtered = useMemo(
    () => filterHttpStatusCodes(HTTP_STATUS_CODES, query, category || undefined),
    [query, category],
  )

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <FieldForm
        label="Search"
        name="status-search"
        onChange={setQuery}
        placeholder="Search by code, name, or description..."
        type="text"
        value={query}
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            aria-pressed={category === cat.value}
            className={`rounded border px-3 py-1 text-body-xs ${category === cat.value ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-500'}`}
            key={cat.label}
            onClick={() => setCategory(cat.value)}
            type="button"
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex max-h-[400px] flex-col gap-2 overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-body-sm text-gray-500">No matching status codes</p>
        ) : (
          filtered.map((code) => (
            <div className="rounded border border-gray-800 bg-gray-950 p-3" key={code.code}>
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-body-lg font-bold ${CATEGORY_COLORS[code.category] ?? 'text-gray-300'}`}>
                  {code.code}
                </span>
                <span className="text-body-sm font-medium text-gray-200">{code.name}</span>
              </div>
              <p className="mt-1 text-body-xs text-gray-400">{code.description}</p>
              <p className="mt-1 text-body-xs text-gray-500">💡 {code.useCase}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
