import {
  formatYaml as wasmFormatYaml,
  getYamlParseError as wasmGetYamlParseError,
  jsonToYaml as wasmJsonToYaml,
  yamlToJson as wasmYamlToJson,
} from '@/wasm/csr-parsers'

export async function formatYaml(
  input: string,
  options?: { indent?: number; sortKeys?: boolean },
): Promise<string> {
  return wasmFormatYaml(input, options)
}

export async function getYamlParseError(input: string): Promise<string | null> {
  return wasmGetYamlParseError(input)
}

export async function jsonToYaml(input: string): Promise<string> {
  return wasmJsonToYaml(input)
}

export async function yamlToJson(input: string, indent = 2): Promise<string> {
  return wasmYamlToJson(input, indent)
}
