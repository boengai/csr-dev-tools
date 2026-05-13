import type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufSchemaInfo } from '@/utils'

export type EntryKind = 'enum' | 'message'

export type BrowsableEntry =
  | { enumInfo: ProtobufEnumInfo; fullName: string; kind: 'enum'; name: string }
  | { fullName: string; kind: 'message'; messageInfo: ProtobufMessageInfo; name: string }

export type ParseOutput = {
  parseError: { line: number | null; message: string } | null
  schema: ProtobufSchemaInfo | null
}
