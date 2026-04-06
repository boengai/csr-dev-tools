import type {
  CodecResult,
  OutputFormat,
} from '@/types/utils/protobuf-codec'
import type {
  ProtobufParseResult,
} from '@/types/utils/protobuf-to-json'

import { loadWasm } from './init'

type CsrParsers = {
  decode_protobuf: (schema: string, messageType: string, input: string, format: string) => string
  detect_protobuf_format: (input: string) => string
  encode_protobuf: (schema: string, messageType: string, json: string, format: string) => string
  format_yaml: (input: string, indent: number, sortKeys: boolean) => string
  generate_sample_json_from_schema: (schemaJson: string, messageName: string) => string
  get_toml_parse_error: (input: string) => string | undefined
  get_xml_parse_error: (input: string) => string | undefined
  get_yaml_parse_error: (input: string) => string | undefined
  json_to_toml: (input: string) => string
  json_to_xml: (input: string) => string
  json_to_yaml: (input: string) => string
  parse_protobuf_schema: (input: string) => string
  toml_to_json: (input: string) => string
  xml_to_json: (input: string) => string
  yaml_to_json: (input: string, indent: number) => string
}

// ── XML ──

export async function xmlToJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.xml_to_json(input)
}

export async function jsonToXml(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.json_to_xml(input)
}

export async function getXmlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.get_xml_parse_error(input) ?? null
}

// ── YAML ──

export async function yamlToJson(input: string, indent = 2): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.yaml_to_json(input, indent)
}

export async function jsonToYaml(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.json_to_yaml(input)
}

export async function formatYaml(
  input: string,
  options?: { indent?: number; sortKeys?: boolean },
): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.format_yaml(input, options?.indent ?? 2, options?.sortKeys ?? false)
}

export async function getYamlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.get_yaml_parse_error(input) ?? null
}

// ── TOML ──

export async function tomlToJson(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.toml_to_json(input)
}

export async function jsonToToml(input: string): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.json_to_toml(input)
}

export async function getTomlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.get_toml_parse_error(input) ?? null
}

// ── Protobuf Schema ──

export async function parseProtobufSchema(input: string): Promise<ProtobufParseResult> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return JSON.parse(wasm.parse_protobuf_schema(input)) as ProtobufParseResult
}

export async function generateSampleJsonFromSchema(
  schemaJson: string,
  messageName: string,
): Promise<string> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.generate_sample_json_from_schema(schemaJson, messageName)
}

// ── Protobuf Codec ──

export async function encodeProtobuf(
  schema: string,
  messageTypeName: string,
  jsonString: string,
  outputFormat: OutputFormat,
): Promise<CodecResult> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return JSON.parse(wasm.encode_protobuf(schema, messageTypeName, jsonString, outputFormat)) as CodecResult
}

export async function decodeProtobuf(
  schema: string,
  messageTypeName: string,
  input: string,
  inputFormat: OutputFormat,
): Promise<CodecResult> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return JSON.parse(wasm.decode_protobuf(schema, messageTypeName, input, inputFormat)) as CodecResult
}

export async function detectProtobufFormat(input: string): Promise<OutputFormat> {
  const wasm = await loadWasm<CsrParsers>('csr-parsers')
  return wasm.detect_protobuf_format(input) as OutputFormat
}
