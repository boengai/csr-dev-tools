import type { OutputFormat } from '@/utils/protobuf-codec'

export type Action = 'decode' | 'encode'

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
