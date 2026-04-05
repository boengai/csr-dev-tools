import type { ProtobufEnumInfo, ProtobufMessageInfo } from '@/utils'

export type EntryKind = 'enum' | 'message'

export type BrowsableEntry =
  | { enumInfo: ProtobufEnumInfo; fullName: string; kind: 'enum'; name: string }
  | { fullName: string; kind: 'message'; messageInfo: ProtobufMessageInfo; name: string }
