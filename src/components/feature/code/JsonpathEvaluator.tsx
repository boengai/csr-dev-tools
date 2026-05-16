import { json } from '@codemirror/lang-json'
import { AnimatePresence, m } from 'motion/react'
import { useMemo, useState } from 'react'

import { CodeInput, CopyButton, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useMountOnce, useToast, useToolFieldsPersisted } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { evaluateJsonPath, formatResultValue, type JsonPathEvaluation, parseJsonInput, tv } from '@/utils'

const chevronStyles = tv({
  base: 'inline-block transition-transform',
  variants: {
    open: {
      true: 'rotate-90',
      false: '',
    },
  },
})

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

type EvalInput = { expression: string; jsonInput: string }
type EvalResult = { evaluation: JsonPathEvaluation | null; parseError: string | null; parsedData: unknown }

const INITIAL_RESULT: EvalResult = { evaluation: null, parseError: null, parsedData: null }

export const JsonpathEvaluator = (_props: ToolComponentProps) => {
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)
  const { showError } = useToast()

  const { inputs, result, setFields, setFieldsImmediate } = useToolFieldsPersisted<EvalInput, EvalResult>({
    compute: ({ expression: expr, jsonInput: value }) => {
      const parsed = parseJsonInput(value)
      if (!parsed.success) return { evaluation: null, parseError: parsed.error, parsedData: null }
      if (!expr.trim()) return { evaluation: null, parseError: null, parsedData: parsed.data }
      return { evaluation: evaluateJsonPath(parsed.data, expr), parseError: null, parsedData: parsed.data }
    },
    debounceMs: 300,
    initial: { jsonInput: SAMPLE_JSON, expression: DEFAULT_EXPRESSION },
    initialResult: INITIAL_RESULT,
    onError: () => {
      showError('Unexpected error during evaluation')
    },
    storageKey: 'csr-dev-tools-jsonpath-evaluator',
  })
  const { jsonInput, expression } = inputs
  const { evaluation, parseError, parsedData } = result

  // Unconditional mount-time recompute. Tool has no isEmpty, so useToolFieldsPersisted's
  // autorun-gated-on-isEmpty does NOT fire — we explicitly trigger here.
  useMountOnce(() => {
    setFieldsImmediate({})
  })

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
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="md:flex-row flex flex-col gap-4">
        {/* Left Panel: JSON Input */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="text-body-sm font-semibold text-gray-100">JSON Input</h3>
          <CodeInput
            aria-label="JSON input"
            extensions={jsonExtensions}
            name="json-input"
            onChange={handleJsonChange}
            placeholder="Paste JSON here..."
            value={jsonInput}
          />
          {parseError && (
            <p className="text-red-400 text-body-xs" role="alert">
              {parseError}
            </p>
          )}
        </div>

        {/* Right Panel: Expression + Results */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Expression Input */}
          <div className="flex flex-col gap-2">
            <h3 className="text-body-sm font-semibold text-gray-100">JSONPath Expression</h3>
            <div aria-label="JSONPath expression" className="font-mono">
              <TextInput
                aria-label="JSONPath expression"
                name="jsonpath-expression"
                onChange={handleExpressionChange}
                placeholder="Enter JSONPath expression (e.g., $.store.book[*].author)"
                type="text"
                value={expression}
              />
            </div>
            {evaluation && !evaluation.success && (
              <p className="text-red-400 text-body-xs" role="alert">
                {evaluation.error}
              </p>
            )}
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-2">
            <h3 className="text-body-sm font-semibold text-gray-100">Results</h3>
            <div aria-live="polite">
              {evaluation?.success && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-body-xs text-gray-400" role="status">
                      {evaluation.results.length === 0
                        ? 'No matches'
                        : `${evaluation.results.length} match${evaluation.results.length === 1 ? '' : 'es'} found`}
                    </p>
                    {evaluation.results.length > 0 && (
                      <CopyButton label="all results" value={allResultsJson} variant="icon-only" />
                    )}
                  </div>

                  {evaluation.results.length > 0 && (
                    <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                      {evaluation.results.map((entry) => (
                        <div
                          className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 p-3"
                          key={entry.path}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-body-xs text-gray-400">{entry.path}</span>
                            <CopyButton
                              label="result value"
                              value={formatResultValue(entry.value)}
                              variant="icon-only"
                            />
                          </div>
                          <pre className="overflow-x-auto font-mono text-body-xs whitespace-pre-wrap text-gray-200">
                            {formatResultValue(entry.value)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!evaluation && parsedData !== null && (
                <p className="text-body-xs text-gray-500">Enter a JSONPath expression to see results</p>
              )}

              {parsedData == null && !parseError && (
                <p className="text-body-xs text-gray-500">Paste JSON to get started</p>
              )}
            </div>
          </div>

          {/* Cheatsheet Toggle */}
          <div className="flex flex-col gap-2">
            <button
              aria-expanded={cheatsheetOpen}
              className="relative flex cursor-pointer items-center gap-2 text-body-xs text-gray-400 before:absolute before:inset-x-0 before:inset-y-[-8px] before:content-[''] hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => setCheatsheetOpen((prev) => !prev)}
              type="button"
            >
              <span className={chevronStyles({ open: cheatsheetOpen })}>▶</span>
              JSONPath Cheatsheet
            </button>

            <AnimatePresence>
              {cheatsheetOpen && (
                <m.div
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded border border-gray-800 bg-gray-950">
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
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
