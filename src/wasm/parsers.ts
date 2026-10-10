import type { CodecResult, OutputFormat } from '@/types/utils/protobuf-codec'
import type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufParseResult } from '@/types/utils/protobuf-to-json'
import type { ParsersWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export type {
  ProtobufEnumInfo,
  ProtobufMessageInfo,
  ProtobufParseResult,
  ProtobufSchemaInfo,
} from '@/types/utils/protobuf-to-json'

// ── XML ──

export async function xmlToJson(input: string): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.xml_to_json(input)
}

export async function jsonToXml(input: string): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.json_to_xml(input)
}

export async function getXmlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.get_xml_parse_error(input) ?? null
}

// ── YAML ──

export async function yamlToJson(input: string, indent = 2): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.yaml_to_json(input, indent)
}

export async function jsonToYaml(input: string): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.json_to_yaml(input)
}

export async function formatYaml(input: string, options?: { indent?: number; sortKeys?: boolean }): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.format_yaml(input, options?.indent ?? 2, options?.sortKeys ?? false)
}

export async function getYamlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.get_yaml_parse_error(input) ?? null
}

// ── TOML ──

export async function tomlToJson(input: string): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.toml_to_json(input)
}

export async function jsonToToml(input: string): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.json_to_toml(input)
}

export async function getTomlParseError(input: string): Promise<string | null> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.get_toml_parse_error(input) ?? null
}

// ── Protobuf Schema ──

export async function parseProtobufSchema(input: string): Promise<ProtobufParseResult> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return JSON.parse(wasm.parse_protobuf_schema(input)) as ProtobufParseResult
}

export async function generateSampleJsonFromSchema(schemaJson: string, messageName: string): Promise<string> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.generate_sample_json_from_schema(schemaJson, messageName)
}

/**
 * Convenience wrapper around `generateSampleJsonFromSchema` that takes the
 * already-parsed message + enum lists (the shape Tools have on hand) and
 * returns a parsed JSON object instead of a string. The lower-level function
 * stays available for callers that need the raw schema JSON pipeline.
 */
export async function generateSampleJson(
  message: ProtobufMessageInfo,
  allMessages: Array<ProtobufMessageInfo>,
  allEnums: Array<ProtobufEnumInfo>,
): Promise<Record<string, unknown>> {
  const schemaJson = JSON.stringify({ enums: allEnums, messages: allMessages, package: null, syntax: null })
  const result = await generateSampleJsonFromSchema(schemaJson, message.name)
  return JSON.parse(result) as Record<string, unknown>
}

// ── Protobuf Codec ──

export async function encodeProtobuf(
  schema: string,
  messageTypeName: string,
  jsonString: string,
  outputFormat: OutputFormat,
): Promise<CodecResult> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return JSON.parse(wasm.encode_protobuf(schema, messageTypeName, jsonString, outputFormat)) as CodecResult
}

export async function decodeProtobuf(
  schema: string,
  messageTypeName: string,
  input: string,
  inputFormat: OutputFormat,
): Promise<CodecResult> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return JSON.parse(wasm.decode_protobuf(schema, messageTypeName, input, inputFormat)) as CodecResult
}

export async function detectProtobufFormat(input: string): Promise<OutputFormat> {
  const wasm = await loadWasm<ParsersWasm>('parsers')
  return wasm.detect_protobuf_format(input) as OutputFormat
}
