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

export type CodecInput = { format: OutputFormat; msgType: string; schema: string; source: string }
export type SchemaParseOutput = { messageTypes: Array<string>; toastError: string | null }

export type ProtobufDirection = 'encode' | 'decode'

// UploadCtx carries the callbacks and state a profile's upload handler needs
// from the component without prop-drilling the full ContentProps.
export type UploadCtx = {
  format: OutputFormat
  onFormatChange: (v: string) => void
  onSourceChange: (v: string) => void
  schema: string
  selectedMessageType: string
  setInputImmediate: (input: CodecInput) => void
  showError: (msg: string) => void
  showSuccess: (msg: string) => void
}

export type ProtobufDownloadResult = { blob: Blob; filename: string }

export type DirectionProfile = {
  computeFn: (input: CodecInput) => Promise<string>
  defaultErrorMsg: string
  download: {
    ariaLabel: string
    build: (result: string, msgType: string, format: OutputFormat) => ProtobufDownloadResult
  }
  formatRadio: { label: string; placement: 'belowDivider' | 'toolbar' }
  resultPlaceholder: string
  selectSize?: 'compact'
  sourceInput: { kind: 'code' | 'textarea'; placeholder: string }
  upload: {
    accept: string
    buttonLabel: string
    handle: (file: File, ctx: UploadCtx) => Promise<void>
  }
}

export type ProtobufContentProps = ContentProps & { direction: ProtobufDirection }

export type ProtobufDownloadButtonProps = { ariaLabel: string; disabled: boolean; onClick: () => void }
