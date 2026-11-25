import { useState } from 'react'

import { Button, DisclosurePanel, FieldForm, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { readJsonStorage } from '@/hooks'
import type { JsonPathEvalInput, ToolComponentProps, TransformerField } from '@/types'
import { createCachedJsonParser, evaluateJsonPath } from '@/utils/jsonpath-evaluator'

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

const INITIAL: JsonPathEvalInput = { expression: '$.store.book[*].author', source: '' }

const STORAGE_KEY = 'csr-dev-tools-jsonpath-evaluator-v2'
// Before the TransformerShell migration the bag was `{ expression, jsonInput }` here.
const LEGACY_STORAGE_KEY = 'csr-dev-tools-jsonpath-evaluator'

/** Moves a pre-migration bag to the shell's key once, so it isn't lost. */
const migrateLegacyBag = (): void => {
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (stored === null || localStorage.getItem(STORAGE_KEY) !== null) return
    const { expression, jsonInput } = readJsonStorage(LEGACY_STORAGE_KEY, {
      expression: INITIAL.expression,
      jsonInput: INITIAL.source,
    })
    // Junk, or the same as opening fresh.
    if (expression === INITIAL.expression && jsonInput === INITIAL.source) return
    // Removed first: storage may not have room for both copies.
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    try {
      // Not `writeJsonStorage`, which swallows a failed write.
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expression, source: jsonInput } satisfies JsonPathEvalInput))
    } catch {
      localStorage.setItem(LEGACY_STORAGE_KEY, stored)
    }
  } catch {
    // Storage unavailable: the tool opens with its defaults.
  }
}

// Each match row copies its value as JSON; Copy all joins those into one array.
// The "No matches" row has no `copyValue`, so there is nothing to copy.
const copyAllMatches = (fields: Array<TransformerField>): string => {
  const values = fields.flatMap((f) => (f.copyValue === undefined ? [] : [JSON.parse(f.copyValue) as unknown]))
  return values.length > 0 ? JSON.stringify(values, null, 2) : ''
}

export const JsonpathEvaluator = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  // Runs once, before the shell reads storage on mount.
  useState(migrateLegacyBag)
  // Expression keystrokes re-run compute; the document is only re-parsed when it changes.
  const [parseJson] = useState(createCachedJsonParser)

  return (
    <TransformerShell<JsonPathEvalInput, 'fields'>
      autoOpen={autoOpen}
      compute={({ expression, source }) => {
        const parsed = parseJson(source)
        if (!parsed.success) throw new Error(parsed.error)
        if (!expression.trim()) return []
        const evaluation = evaluateJsonPath(parsed.data, expression)
        if (!evaluation.success) throw new Error(evaluation.error)
        if (evaluation.results.length === 0) {
          return [{ copy: false, label: 'No matches', value: `${expression.trim()} matched nothing in this JSON` }]
        }
        return evaluation.results.map(({ path, value }) => {
          const json = JSON.stringify(value, null, 2)
          return { copyValue: json, label: path, value: json }
        })
      }}
      copyAll={copyAllMatches}
      description={toolEntry?.description}
      errorFallback="Unexpected error during evaluation"
      initial={INITIAL}
      onAfterClose={onAfterClose}
      outputKind="fields"
      renderControls={({ inputs, setFields, setFieldsImmediate }) => (
        <>
          <div className="sm:flex-1 w-full font-mono">
            <FieldForm
              label="JSONPath Expression"
              name="jsonpath-expression"
              onChange={(val: string) => setFields({ expression: val })}
              placeholder="$.store.book[*].author"
              type="text"
              value={inputs.expression}
            />
          </div>
          <Button onClick={() => setFieldsImmediate({ source: SAMPLE_JSON })} size="small">
            Load sample
          </Button>
          <div className="w-full">
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
                          onClick={() => setFieldsImmediate({ expression: entry.expression })}
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
        </>
      )}
      resultLabel="Matches"
      resultPlaceholder="Paste JSON and enter a JSONPath expression to see what it matches"
      sourceLabel="JSON Input"
      sourcePlaceholder="Paste JSON here..."
      storageKey={STORAGE_KEY}
      title="JSONPath Evaluator"
      triggerLabel="Evaluate"
    />
  )
}
