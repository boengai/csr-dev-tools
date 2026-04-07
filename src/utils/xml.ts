import {
  getXmlParseError as wasmGetXmlParseError,
  jsonToXml as wasmJsonToXml,
  xmlToJson as wasmXmlToJson,
} from '@/wasm/parsers'

export async function xmlToJson(input: string): Promise<string> {
  return wasmXmlToJson(input)
}

export async function jsonToXml(input: string): Promise<string> {
  return wasmJsonToXml(input)
}

export async function getXmlParseError(input: string): Promise<string | null> {
  return wasmGetXmlParseError(input)
}
