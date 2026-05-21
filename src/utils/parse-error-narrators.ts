import { getCsvParseError } from '@/wasm/csv'
import { getJsonParseError } from '@/wasm/json-tools'
import { getTomlParseError, getXmlParseError, getYamlParseError } from '@/wasm/parsers'

export type SourceFormat = 'csv' | 'json' | 'toml' | 'xml' | 'yaml'

type Narrator = {
  label: string
  get: (source: string) => Promise<string | null>
}

const NARRATORS: Record<SourceFormat, Narrator> = {
  csv: { label: 'CSV', get: getCsvParseError },
  json: { label: 'JSON', get: getJsonParseError },
  toml: { label: 'TOML', get: getTomlParseError },
  xml: { label: 'XML', get: getXmlParseError },
  yaml: { label: 'YAML', get: getYamlParseError },
}

export const narrateParseError = async (
  format: SourceFormat,
  source: string,
): Promise<string | null> => {
  const { get, label } = NARRATORS[format]
  const reason = await get(source)
  return reason != null ? `Invalid ${label}: ${reason}` : null
}
