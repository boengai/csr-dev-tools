import type { ParseErrorNarrator, SourceFormat } from '@/types'
import { getCsvParseError } from '@/wasm/csv'
import { getJsonParseError } from '@/wasm/json-tools'
import { getTomlParseError, getXmlParseError, getYamlParseError } from '@/wasm/parsers'

const NARRATORS: Record<SourceFormat, ParseErrorNarrator> = {
  csv: { label: 'CSV', get: getCsvParseError },
  json: { label: 'JSON', get: getJsonParseError },
  toml: { label: 'TOML', get: getTomlParseError },
  xml: { label: 'XML', get: getXmlParseError },
  yaml: { label: 'YAML', get: getYamlParseError },
}

export const narrateParseError = async (format: SourceFormat, source: string): Promise<string | null> => {
  const { get, label } = NARRATORS[format]
  const reason = await get(source)
  return reason != null ? `Invalid ${label}: ${reason}` : null
}
