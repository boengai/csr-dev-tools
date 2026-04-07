import type { JsonToTsOptions } from '@/types/utils/json-to-typescript'

import { loadWasm } from './init'

type CsrJsonTools = {
  deep_sort_json: (input: string) => string
  format_json: (input: string, indent: number) => string
  get_json_diff_error: (input: string, label: string) => string | undefined
  get_json_parse_error: (input: string) => string | undefined
  json_to_typescript: (json: string, useInterface: boolean, optionalProperties: boolean, rootName: string) => string
  normalize_json: (input: string) => string
}

export async function formatJson(input: string, indent = 2): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('json-tools')
  return wasm.format_json(input, indent)
}

export async function getJsonParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrJsonTools>('json-tools')
  return wasm.get_json_parse_error(input) ?? null
}

export async function jsonToTypeScript(
  json: string,
  opts?: Partial<JsonToTsOptions>,
): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('json-tools')
  return wasm.json_to_typescript(
    json,
    opts?.useInterface ?? true,
    opts?.optionalProperties ?? false,
    opts?.rootName ?? 'Root',
  )
}

export async function deepSortJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('json-tools')
  return wasm.deep_sort_json(input)
}

export async function normalizeJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrJsonTools>('json-tools')
  return wasm.normalize_json(input)
}

export async function getJsonDiffError(input: string, label: string): Promise<string | null> {
  const wasm = await loadWasm<CsrJsonTools>('json-tools')
  return wasm.get_json_diff_error(input, label) ?? null
}
