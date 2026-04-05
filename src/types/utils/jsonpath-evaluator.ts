export type JsonPathResult = {
  path: string
  value: unknown
}

export type JsonPathEvaluation = { error: string; success: false } | { results: Array<JsonPathResult>; success: true }

export type JsonParseResult = { error: string; success: false } | { data: unknown; formatted: string; success: true }
