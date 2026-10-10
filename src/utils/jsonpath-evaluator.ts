import { JSONPath } from 'jsonpath-plus'

import type {
  JsonParseCacheEntry,
  JsonPathEvaluation,
  JsonParseResult,
  JsonPathResult,
} from '@/types/utils/jsonpath-evaluator'

export function parseJsonInput(input: string): JsonParseResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { error: 'Empty input — paste JSON to evaluate', success: false }
  }

  try {
    const data: unknown = JSON.parse(trimmed)
    return { data, formatted: JSON.stringify(data, null, 2), success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { error: message, success: false }
  }
}

/**
 * Returns a `parseJsonInput` that memoizes the most recent input. Lets a
 * caller re-evaluate many expressions against the same document without
 * re-parsing (and re-formatting) it on every keystroke.
 */
export function createCachedJsonParser(): (input: string) => JsonParseResult {
  let last: JsonParseCacheEntry | null = null
  return (input) => {
    if (last?.input !== input) last = { input, result: parseJsonInput(input) }
    return last.result
  }
}

export function evaluateJsonPath(data: unknown, expression: string): JsonPathEvaluation {
  const trimmed = expression.trim()
  if (!trimmed) {
    return { error: 'Empty expression — enter a JSONPath expression', success: false }
  }

  try {
    const results = JSONPath({
      json: data as object,
      path: trimmed,
      resultType: 'all',
    }) as unknown as Array<JsonPathResult>

    return {
      results: results.map((r) => ({ path: r.path, value: r.value })),
      success: true,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { error: message, success: false }
  }
}

export function formatResultValue(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

export type { JsonPathResult, JsonPathEvaluation, JsonParseResult } from '@/types/utils/jsonpath-evaluator'
