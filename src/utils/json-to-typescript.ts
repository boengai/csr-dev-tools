import type { JsonToTsOptions } from '@/types/utils/json-to-typescript'

import { jsonToTypeScript as wasmJsonToTypeScript } from '@/wasm/csr-json-tools'

export async function jsonToTypeScript(
  json: string,
  opts?: Partial<JsonToTsOptions>,
): Promise<string> {
  return wasmJsonToTypeScript(json, opts)
}
