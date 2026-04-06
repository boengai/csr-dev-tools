import type { CodecResult, OutputFormat } from '@/types/utils/protobuf-codec'

import {
  decodeProtobuf as wasmDecodeProtobuf,
  detectProtobufFormat as wasmDetectProtobufFormat,
  encodeProtobuf as wasmEncodeProtobuf,
} from '@/wasm/csr-parsers'

export async function detectProtobufFormat(input: string): Promise<OutputFormat> {
  return wasmDetectProtobufFormat(input)
}

export async function encodeProtobuf(
  schema: string,
  messageTypeName: string,
  jsonString: string,
  outputFormat: OutputFormat,
): Promise<CodecResult> {
  return wasmEncodeProtobuf(schema, messageTypeName, jsonString, outputFormat)
}

export async function decodeProtobuf(
  schema: string,
  messageTypeName: string,
  input: string,
  inputFormat: OutputFormat,
): Promise<CodecResult> {
  return wasmDecodeProtobuf(schema, messageTypeName, input, inputFormat)
}

export type { OutputFormat } from '@/types/utils/protobuf-codec'
