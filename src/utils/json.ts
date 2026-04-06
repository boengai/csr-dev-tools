import {
  formatJson as wasmFormatJson,
  getJsonParseError as wasmGetJsonParseError,
} from '@/wasm/csr-json-tools'

export async function formatJson(input: string, indent = 2): Promise<string> {
  return wasmFormatJson(input, indent)
}

export async function getJsonParseError(input: string): Promise<string | null> {
  return wasmGetJsonParseError(input)
}
