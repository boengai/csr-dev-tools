import {
  deepSortJson as wasmDeepSortJson,
  getJsonDiffError as wasmGetJsonDiffError,
  normalizeJson as wasmNormalizeJson,
} from '@/wasm/csr-json-tools'

export async function deepSortJson(input: string): Promise<string> {
  return wasmDeepSortJson(input)
}

export async function normalizeJson(input: string): Promise<string> {
  return wasmNormalizeJson(input)
}

export async function getJsonDiffError(input: string, label: string): Promise<string | null> {
  return wasmGetJsonDiffError(input, label)
}
