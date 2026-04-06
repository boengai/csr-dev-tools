import {
  getTomlParseError as wasmGetTomlParseError,
  jsonToToml as wasmJsonToToml,
  tomlToJson as wasmTomlToJson,
} from '@/wasm/csr-parsers'

export async function tomlToJson(input: string): Promise<string> {
  return wasmTomlToJson(input)
}

export async function jsonToToml(input: string): Promise<string> {
  return wasmJsonToToml(input)
}

export async function getTomlParseError(input: string): Promise<string | null> {
  return wasmGetTomlParseError(input)
}
