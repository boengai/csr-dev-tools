import type { OutputFormat } from '@/types/utils/protobuf-codec'

export type ProtobufCodecAction = 'decode' | 'encode'

export type PersistedState = {
  decodeFormat: OutputFormat
  decodeSource: string
  encodeFormat: OutputFormat
  encodeSource: string
  schema: string
}

export type ContentProps = {
  format: OutputFormat
  messageTypes: Array<string>
  onFormatChange: (value: string) => void
  onMessageTypeChange: (value: string) => void
  onSchemaChange: (value: string) => void
  onSourceChange: (value: string) => void
  schema: string
  selectedMessageType: string
  source: string
}

export type EncodeInput = { format: OutputFormat; msgType: string; schema: string; source: string }
export type DecodeInput = { format: OutputFormat; msgType: string; schema: string; source: string }
export type SchemaParseOutput = { messageTypes: Array<string>; toastError: string | null }
