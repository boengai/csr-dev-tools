import type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufParseResult, ProtobufSchemaInfo } from '@/types/utils/protobuf-to-json'

import {
  generateSampleJsonFromSchema,
  parseProtobufSchema as wasmParseProtobufSchema,
} from '@/wasm/csr-parsers'

export async function parseProtobufSchema(protoSource: string): Promise<ProtobufParseResult> {
  return wasmParseProtobufSchema(protoSource)
}

export async function generateSampleJson(
  message: ProtobufMessageInfo,
  allMessages: Array<ProtobufMessageInfo>,
  allEnums: Array<ProtobufEnumInfo>,
): Promise<Record<string, unknown>> {
  const schemaJson = JSON.stringify({ enums: allEnums, messages: allMessages, package: null, syntax: null })
  const result = await generateSampleJsonFromSchema(schemaJson, message.name)
  return JSON.parse(result) as Record<string, unknown>
}

export type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufSchemaInfo } from '@/types/utils/protobuf-to-json'
