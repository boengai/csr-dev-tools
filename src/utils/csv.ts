import {
  csvToJson as wasmCsvToJson,
  getCsvParseError as wasmGetCsvParseError,
  jsonToCsv as wasmJsonToCsv,
} from '@/wasm/csr-csv'

export async function jsonToCsv(input: string): Promise<string> {
  return wasmJsonToCsv(input)
}

export async function csvToJson(input: string, indent = 2): Promise<string> {
  return wasmCsvToJson(input, indent)
}

export async function getCsvParseError(input: string): Promise<string | null> {
  return wasmGetCsvParseError(input)
}
