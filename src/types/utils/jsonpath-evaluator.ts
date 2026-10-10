export type JsonPathResult = {
  path: string
  value: unknown
}

export type JsonPathEvaluation = { error: string; success: false } | { results: Array<JsonPathResult>; success: true }

export type JsonParseResult = { error: string; success: false } | { data: unknown; formatted: string; success: true }

export type JsonPathEvalInput = { expression: string; jsonInput: string }
export type JsonPathEvalResult = {
  evaluation: JsonPathEvaluation | null
  parseError: string | null
  parsedData: unknown
}

export type JsonParseCacheEntry = { input: string; result: JsonParseResult }
