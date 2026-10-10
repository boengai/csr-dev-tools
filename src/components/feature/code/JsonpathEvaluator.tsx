import { json } from '@codemirror/lang-json'
import { useMemo, useState } from 'react'

import {
  CodeInput,
  CopyButton,
  DisclosurePanel,
  EmptyState,
  ErrorBanner,
  Pane,
  SplitPanel,
  TextInput,
} from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolFields } from '@/hooks'
import type { JsonPathEvalInput, JsonPathEvalResult, ToolComponentProps } from '@/types'
import { createCachedJsonParser, evaluateJsonPath, formatResultValue } from '@/utils/jsonpath-evaluator'

const toolEntry = TOOL_REGISTRY_MAP['jsonpath-evaluator']

const SAMPLE_JSON = JSON.stringify(
  {
    store: {
      bicycle: { color: 'red', price: 19.95 },
      book: [
        { author: 'Nigel Rees', category: 'reference', price: 8.95, title: 'Sayings of the Century' },
        { author: 'Evelyn Waugh', category: 'fiction', price: 12.99, title: 'Sword of Honour' },
        {
          author: 'Herman Melville',
          category: 'fiction',
          isbn: '0-553-21311-3',
          price: 8.99,
          title: 'Moby Dick',
        },
        {
          author: 'J. R. R. Tolkien',
          category: 'fiction',
          isbn: '0-395-19395-8',
          price: 22.99,
          title: 'The Lord of the Rings',
        },
      ],
    },
  },
  null,
  2,
)

const DEFAULT_EXPRESSION = '$.store.book[*].author'

const CHEATSHEET_ENTRIES = [
  { description: 'Root object', expression: '$' },
  { description: 'Direct child property', expression: '$.property' },
  { description: 'All direct children', expression: '$.*' },
  { description: 'Recursive descent (all nested)', expression: '$..property' },
  { description: 'Array element by index', expression: '$[0]' },
  { description: 'Multiple array elements', expression: '$[0,1]' },
  { description: 'Array slice (elements 0-2)', expression: '$[0:3]' },
  { description: 'Filter expression', expression: '$[?(@.price<10)]' },
  { description: 'Existence check', expression: '$[?(@.name)]' },
  { description: 'All authors in store', expression: '$.store.book[*].author' },
]

const INITIAL_RESULT: JsonPathEvalResult = { evaluation: null, parseError: null, parsedData: null }

export const JsonpathEvaluator = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  // Expression keystrokes re-run compute; the document is only re-parsed when it changes.
  const [parseJson] = useState(createCachedJsonParser)
  const { inputs, result, setFields, setFieldsImmediate } = useToolFields<JsonPathEvalInput, JsonPathEvalResult>({
    autorunOnMount: true,
    compute: ({ expression: expr, jsonInput: value }) => {
      const parsed = parseJson(value)
      if (!parsed.success) return { evaluation: null, parseError: parsed.error, parsedData: null }
      if (!expr.trim()) return { evaluation: null, parseError: null, parsedData: parsed.data }
      return { evaluation: evaluateJsonPath(parsed.data, expr), parseError: null, parsedData: parsed.data }
    },
    debounceMs: 300,
    errorLabel: 'Unexpected error during evaluation',
    initial: { jsonInput: SAMPLE_JSON, expression: DEFAULT_EXPRESSION },
    initialResult: INITIAL_RESULT,
    storageKey: 'csr-dev-tools-jsonpath-evaluator',
  })
  const { jsonInput, expression } = inputs
  const { evaluation, parseError, parsedData } = result

  const handleJsonChange = (value: string) => setFields({ jsonInput: value })
  const handleExpressionChange = (value: string) => setFields({ expression: value })
  const handleCheatsheetClick = (expr: string) => setFieldsImmediate({ expression: expr })

  const jsonExtensions = useMemo(() => [json()], [])

  const allResultsJson = useMemo(
    () =>
      evaluation?.success
        ? JSON.stringify(
            evaluation.results.map((r) => r.value),
            null,
            2,
          )
        : '',
    [evaluation],
  )

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      title="JSONPath Evaluator"
      triggers={[{ label: 'Evaluate' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          {/* Left Pane: both inputs (Expression on top, JSON Input below) */}
          <Pane gap="md">
            <div className="flex flex-col gap-2">
              <h3 className="text-body-sm font-semibold text-gray-100">JSONPath Expression</h3>
              <div className="font-mono">
                <TextInput
                  aria-label="JSONPath expression"
                  name="jsonpath-expression"
                  onChange={handleExpressionChange}
                  placeholder="Enter JSONPath expression (e.g., $.store.book[*].author)"
                  type="text"
                  value={expression}
                />
              </div>
              {evaluation && !evaluation.success && <ErrorBanner>{evaluation.error}</ErrorBanner>}
            </div>

            <div className="flex min-h-0 grow flex-col gap-2">
              <h3 className="text-body-sm font-semibold text-gray-100">JSON Input</h3>
              <CodeInput
                aria-label="JSON input"
                extensions={jsonExtensions}
                name="json-input"
                onChange={handleJsonChange}
                placeholder="Paste JSON here..."
                value={jsonInput}
              />
              {parseError && <ErrorBanner>{parseError}</ErrorBanner>}
            </div>
          </Pane>

          {/* Right Pane: Results */}
          <Pane live scroll>
            <div className="flex items-center justify-between">
              <h3 className="text-body-sm font-semibold text-gray-100">Results</h3>
              {evaluation?.success && evaluation.results.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-body-xs text-gray-400" role="status">
                    {`${evaluation.results.length} match${evaluation.results.length === 1 ? '' : 'es'} found`}
                  </p>
                  <CopyButton label="all results" value={allResultsJson} variant="icon-only" />
                </div>
              )}
              {evaluation?.success && evaluation.results.length === 0 && (
                <p className="text-body-xs text-gray-400" role="status">
                  No matches
                </p>
              )}
            </div>

            {evaluation?.success && evaluation.results.length > 0 && (
              <div className="flex flex-col gap-2">
                {evaluation.results.map((entry) => (
                  <div className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 p-3" key={entry.path}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-body-xs text-gray-400">{entry.path}</span>
                      <CopyButton label="result value" value={formatResultValue(entry.value)} variant="icon-only" />
                    </div>
                    <pre className="overflow-x-auto font-mono text-body-xs whitespace-pre-wrap text-gray-200">
                      {formatResultValue(entry.value)}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {!evaluation && parsedData !== null && <EmptyState>Enter a JSONPath expression to see results</EmptyState>}

            {parsedData == null && !parseError && <EmptyState>Paste JSON to get started</EmptyState>}
          </Pane>
        </SplitPanel>

        <DisclosurePanel label="JSONPath Cheatsheet" padding="none">
          <table className="w-full text-body-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-3 py-2 text-left font-semibold text-gray-300">Expression</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-300">Description</th>
              </tr>
            </thead>
            <tbody>
              {CHEATSHEET_ENTRIES.map((entry) => (
                <tr className="border-b border-gray-800/50 last:border-0" key={entry.expression}>
                  <td className="px-3 py-1.5">
                    <button
                      aria-label={`Use expression: ${entry.expression}`}
                      className="cursor-pointer font-mono text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      onClick={() => handleCheatsheetClick(entry.expression)}
                      type="button"
                    >
                      {entry.expression}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-gray-400">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DisclosurePanel>
      </div>
    </ToolDialogFrame>
  )
}
