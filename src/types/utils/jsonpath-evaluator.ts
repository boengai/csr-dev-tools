export type JsonPathResult = {
  path: string
  value: unknown
}

export type JsonPathEvaluation = { error: string; success: false } | { results: Array<JsonPathResult>; success: true }

export type JsonParseResult = { error: string; success: false } | { data: unknown; formatted: string; success: true }

/** The JSONPath Evaluator's field bag: the JSON document is the source, the expression a control. */
export type JsonPathEvalInput = { expression: string; source: string }

export type JsonParseCacheEntry = { input: string; result: JsonParseResult }
