import type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufSchemaInfo } from '@/wasm/parsers'

export type EntryKind = 'enum' | 'message'

export type BrowsableEntry =
  | { enumInfo: ProtobufEnumInfo; fullName: string; kind: 'enum'; name: string }
  | { fullName: string; kind: 'message'; messageInfo: ProtobufMessageInfo; name: string }

export type ParseOutput = {
  parseError: { line: number | null; message: string } | null
  schema: ProtobufSchemaInfo | null
}

/**
 * A generated sample, carrying the message and schema it was generated from so
 * it is always annotated consistently — even while a reparse's regenerated
 * sample is still pending. Matched to the selection by `message.fullName`.
 */
export type ProtobufSampleJson = { json: unknown; message: ProtobufMessageInfo; schema: ProtobufSchemaInfo }
