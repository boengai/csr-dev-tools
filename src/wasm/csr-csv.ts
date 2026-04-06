import { loadWasm } from './init'

type CsrCsv = {
  json_to_csv: (input: string) => string
  csv_to_json: (input: string, indent: number) => string
  get_csv_parse_error: (input: string) => string | undefined
}

export async function jsonToCsv(input: string): Promise<string> {
  const wasm = await loadWasm<CsrCsv>('csr-csv')
  return wasm.json_to_csv(input)
}

export async function csvToJson(input: string, indent = 2): Promise<string> {
  const wasm = await loadWasm<CsrCsv>('csr-csv')
  return wasm.csv_to_json(input, indent)
}

export async function getCsvParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrCsv>('csr-csv')
  return wasm.get_csv_parse_error(input) ?? null
}
