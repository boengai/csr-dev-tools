import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'


import type { ToolComponentProps } from '@/types'
import type { JsonPathEvaluation, JsonParseResult } from '@/utils/jsonpath-evaluator'

import { json } from '@codemirror/lang-json'

import { CodeInput, CopyButton, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useLocalStorage, useToast } from '@/hooks'
import { tv } from '@/utils'
import { evaluateJsonPath, formatResultValue, parseJsonInput } from '@/utils/jsonpath-evaluator'

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

export const JsonpathEvaluator = (_props: ToolComponentProps) => {
  const [jsonInput, setJsonInput] = useLocalStorage('csr-dev-tools-jsonpath-evaluator-json', SAMPLE_JSON)
  const [expression, setExpression] = useLocalStorage('csr-dev-tools-jsonpath-evaluator-expression', DEFAULT_EXPRESSION)
  const [parsedData, setParsedData] = useState<unknown>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<JsonPathEvaluation | null>(null)
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)
  const { toast } = useToast()

  const initializedRef = useRef(false)
  const parsedDataRef = useRef<unknown>(null)
  const expressionRef = useRef(expression)

  const runEvaluation = useCallback(
    (data: unknown, expr: string) => {
      if (data == null || !expr.trim()) {
        setEvaluation(null)
        return
      }
      try {
        const result = evaluateJsonPath(data, expr)
        setEvaluation(result)
      } catch {
        toast({ action: 'add', item: { label: 'Unexpected error during evaluation', type: 'error' } })
      }
    },
    [toast],
  )

  const debouncedParseAndEvaluate = useDebounceCallback((value: string) => {
    const result: JsonParseResult = parseJsonInput(value)
    if (result.success) {
      setParsedData(result.data)
      parsedDataRef.current = result.data
      setParseError(null)
      runEvaluation(result.data, expressionRef.current)
    } else {
      setParsedData(null)
      parsedDataRef.current = null
      setParseError(result.error)
      setEvaluation(null)
    }
  }, 300)

  const debouncedEvaluate = useDebounceCallback((expr: string) => {
    runEvaluation(parsedDataRef.current, expr)
  }, 300)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const result = parseJsonInput(jsonInput)
      if (result.success) {
        setParsedData(result.data)
        parsedDataRef.current = result.data
        runEvaluation(result.data, expression)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    debouncedParseAndEvaluate(value)
  }

  const handleExpressionChange = (value: string) => {
    setExpression(value)
    expressionRef.current = value
    debouncedEvaluate(value)
  }

  const handleCheatsheetClick = (expr: string) => {
    setExpression(expr)
    expressionRef.current = expr
    runEvaluation(parsedDataRef.current, expr)
  }

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
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

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
                      {evaluation.results.map((result, index) => (
                        <div
                          className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 p-3"
                          key={`${result.path}-${index}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-body-xs text-gray-400">{result.path}</span>
                            <CopyButton
                              label="result value"
                              value={formatResultValue(result.value)}
                              variant="icon-only"
                            />
                          </div>
                          <pre className="overflow-x-auto font-mono text-body-xs whitespace-pre-wrap text-gray-200">
                            {formatResultValue(result.value)}
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
              className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-400 hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => setCheatsheetOpen((prev) => !prev)}
              type="button"
            >
              <span className={chevronStyles({ open: cheatsheetOpen })}>▶</span>
              JSONPath Cheatsheet
            </button>

            <AnimatePresence>
              {cheatsheetOpen && (
                <motion.div
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
