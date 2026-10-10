import { useCallback, useEffect, useState } from 'react'

import {
  Button,
  CodeInput,
  CodeOutput,
  CopyButton,
  DownloadIcon,
  FieldForm,
  Pane,
  SelectInput,
  SplitPanel,
  UploadInput,
} from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDownload, useInputLocalStorage, useMountOnce, useToast, useToolComputation } from '@/hooks'
import type {
  CodecInput,
  ContentProps,
  DirectionProfile,
  PersistedState,
  ProtobufCodecAction,
  ProtobufContentProps,
  ProtobufDirection,
  ProtobufDownloadButtonProps,
  SchemaParseOutput,
  ToolComponentProps,
  UploadCtx,
} from '@/types'
import type { OutputFormat } from '@/types/utils/protobuf-codec'
import { detectProtobufFormat } from '@/wasm/parsers'

// ---------------------------------------------------------------------------
// Direction profiles — static lookup table, defined once at module load.
// Exported for tests; not part of the component's public API.
// ---------------------------------------------------------------------------

export const DIRECTION_PROFILES: Record<ProtobufDirection, DirectionProfile> = {
  encode: {
    computeFn: async ({ schema, msgType, source, format }) => {
      const { encodeProtobuf } = await import('@/wasm/parsers')
      const result = await encodeProtobuf(schema, msgType, source, format)
      if (result.success) return result.output
      throw new Error(result.error)
    },
    defaultErrorMsg: 'Failed to encode protobuf',
    upload: {
      accept: '.json,application/json',
      buttonLabel: 'Upload JSON',
      handle: async (file, ctx) => {
        const text = await file.text()
        ctx.onSourceChange(text)
        ctx.setInputImmediate({
          schema: ctx.schema,
          msgType: ctx.selectedMessageType,
          source: text,
          format: ctx.format,
        })
      },
    },
    sourceInput: {
      kind: 'code',
      placeholder: '{"name": "Alice", "age": 30}',
    },
    formatRadio: { placement: 'belowDivider', label: '' },
    download: {
      build: (result, msgType, format) => {
        const timestamp = Date.now()
        const safeName = msgType.replace(/[^a-zA-Z0-9-_]/g, '_')
        if (format === 'binary') {
          const bytes = new Uint8Array(result.length)
          for (let i = 0; i < result.length; i++) {
            bytes[i] = result.charCodeAt(i) & 0xff
          }
          return {
            blob: new Blob([bytes], { type: 'application/octet-stream' }),
            filename: `encoded_${safeName}_${timestamp}.pb`,
          }
        }
        return {
          blob: new Blob([result], { type: 'text/plain' }),
          filename: `encoded_${safeName}_${timestamp}.pb.txt`,
        }
      },
      ariaLabel: 'Download encoded result',
    },
    resultPlaceholder: 'Encoded output will appear here...',
  },

  decode: {
    computeFn: async ({ schema, msgType, source, format }) => {
      const { decodeProtobuf } = await import('@/wasm/parsers')
      const result = await decodeProtobuf(schema, msgType, source, format)
      if (result.success) return result.output
      throw new Error(result.error)
    },
    defaultErrorMsg: 'Failed to decode protobuf',
    upload: {
      accept: '.pb,.bin,.txt,.protobuf',
      buttonLabel: 'Upload .pb',
      handle: async (file, ctx) => {
        const bytes = new Uint8Array(await file.arrayBuffer())
        // Convert to latin1 string (preserves all byte values, unlike UTF-8)
        let raw = ''
        for (const byte of bytes) {
          raw += String.fromCharCode(byte)
        }
        // Try to detect if the content is base64 or hex text
        const textDecoder = new TextDecoder()
        const text = textDecoder.decode(bytes)
        const detected = await detectProtobufFormat(text)
        const value = detected === 'binary' ? raw : text
        ctx.onFormatChange(detected)
        ctx.onSourceChange(value)
        ctx.setInputImmediate({
          schema: ctx.schema,
          msgType: ctx.selectedMessageType,
          source: value,
          format: detected,
        })
        ctx.showSuccess(`Auto-detected format: ${detected}`)
      },
    },
    sourceInput: {
      kind: 'textarea',
      placeholder: 'Paste encoded protobuf data...',
    },
    formatRadio: { placement: 'toolbar', label: 'Input Format' },
    download: {
      build: (result, msgType, _format) => {
        const timestamp = Date.now()
        const safeName = msgType.replace(/[^a-zA-Z0-9-_]/g, '_')
        return {
          blob: new Blob([result], { type: 'application/json' }),
          filename: `decoded_${safeName}_${timestamp}.json`,
        }
      },
      ariaLabel: 'Download decoded JSON',
    },
    resultPlaceholder: '{ "name": "Alice" }',
    selectSize: 'compact',
  },
}

// ---------------------------------------------------------------------------
// Module constants
// ---------------------------------------------------------------------------

const toolEntry = TOOL_REGISTRY_MAP['protobuf-codec']
const INITIAL_STATE: PersistedState = {
  decodeFormat: 'base64',
  decodeSource: '',
  encodeFormat: 'base64',
  encodeSource: '',
  schema: '',
}

const FORMAT_OPTIONS = [
  { label: 'Base64', value: 'base64' },
  { label: 'Hex', value: 'hex' },
  { label: 'Binary', value: 'binary' },
]

// ---------------------------------------------------------------------------
// Download button — shared across both directions
// ---------------------------------------------------------------------------

const DownloadButton = ({ ariaLabel, ...props }: ProtobufDownloadButtonProps) => {
  return (
    <button
      {...props}
      aria-label={ariaLabel}
      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-body-sm transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      type="button"
    >
      <DownloadIcon size={16} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// ProtobufContent — single direction-parametrized component
// ---------------------------------------------------------------------------

const ProtobufContent = ({
  direction,
  format,
  messageTypes,
  onFormatChange,
  onMessageTypeChange,
  onSchemaChange,
  onSourceChange,
  schema,
  selectedMessageType,
  source,
}: ProtobufContentProps) => {
  const showError = useToast((s) => s.showError)
  const showSuccess = useToast((s) => s.showSuccess)
  const { downloadBlob } = useDownload()
  const profile = DIRECTION_PROFILES[direction]

  const { result, setInput, setInputImmediate } = useToolComputation<CodecInput, string>(profile.computeFn, {
    debounceMs: 300,
    errorFallback: profile.defaultErrorMsg,
    initial: '',
    isEmpty: ({ schema: schemaVal, msgType, source: sourceVal }) => !schemaVal.trim() || !msgType || !sourceVal.trim(),
  })

  // Re-run the codec whenever a fresh schema parse lands (new `messageTypes`
  // identity) or the effective message type changes, so the output always
  // reflects the current schema rather than the one at dialog-open time. An
  // invalid/emptied schema yields no message type, which `isEmpty` maps back
  // to the empty result instead of leaving the previous output on screen.
  useEffect(() => {
    setInputImmediate({ schema, msgType: selectedMessageType, source, format })
    // eslint-disable-next-line react/exhaustive-deps -- source/format edits route through their own handlers
  }, [messageTypes, selectedMessageType])

  const handleSourceChange = useCallback(
    (value: string) => {
      onSourceChange(value)
      setInput({ schema, msgType: selectedMessageType, source: value, format })
    },
    [onSourceChange, schema, selectedMessageType, format, setInput],
  )

  const handleFormatChange = useCallback(
    (value: string) => {
      onFormatChange(value)
      if (source) setInputImmediate({ schema, msgType: selectedMessageType, source, format: value as OutputFormat })
    },
    [onFormatChange, source, schema, selectedMessageType, setInputImmediate],
  )

  const handleMessageTypeChange = useCallback(
    (value: string) => {
      onMessageTypeChange(value)
      if (source) setInputImmediate({ schema, msgType: value, source, format })
    },
    [onMessageTypeChange, source, schema, format, setInputImmediate],
  )

  const handleUpload = useCallback(
    async (files: Array<File>) => {
      const file = files[0]
      if (!file) return
      try {
        const ctx: UploadCtx = {
          onFormatChange,
          onSourceChange,
          schema,
          selectedMessageType,
          format,
          setInputImmediate,
          showError,
          showSuccess,
        }
        await profile.upload.handle(file, ctx)
      } catch {
        showError('Failed to read file')
      }
    },
    [
      onFormatChange,
      onSourceChange,
      schema,
      selectedMessageType,
      format,
      setInputImmediate,
      showError,
      showSuccess,
      profile.upload,
    ],
  )

  const handleDownload = useCallback(() => {
    if (!result) return
    const { blob, filename } = profile.download.build(result, selectedMessageType, format)
    downloadBlob(blob, filename)
  }, [downloadBlob, result, selectedMessageType, format, profile.download])

  const toolbarFormatRadio = profile.formatRadio.placement === 'toolbar'
  const belowDividerFormatRadio = profile.formatRadio.placement === 'belowDivider'

  return (
    <div className="flex w-full grow flex-col gap-4">
      <div className="flex flex-col gap-6 tablet:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-2">
          <SelectInput
            name="message-type-select"
            onChange={handleMessageTypeChange}
            options={messageTypes.map((name) => ({ label: name, value: name }))}
            placeholder="Select message type"
            size={profile.selectSize}
            value={selectedMessageType}
          />
        </div>
        <div className="w-px" />
        <div className="flex flex-1 items-center gap-2">
          {toolbarFormatRadio && (
            <FieldForm
              label={profile.formatRadio.label}
              name="format"
              onChange={handleFormatChange}
              options={FORMAT_OPTIONS}
              type="radio"
              value={format}
            />
          )}
          <UploadInput
            accept={profile.upload.accept}
            button={{ children: profile.upload.buttonLabel }}
            multiple={false}
            name={direction === 'encode' ? 'upload-json' : 'upload-pb'}
            onChange={handleUpload}
          />
        </div>
      </div>
      <SplitPanel>
        <Pane>
          <CodeInput
            aria-label="Proto schema input"
            name="proto-schema"
            onChange={onSchemaChange}
            placeholder="Paste your .proto definition here..."
            value={schema}
          />
        </Pane>
        <Pane>
          {profile.sourceInput.kind === 'code' ? (
            <CodeInput
              aria-label="JSON input"
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder={profile.sourceInput.placeholder}
              value={source}
            />
          ) : (
            <FieldForm
              label=""
              name="dialog-source"
              onChange={handleSourceChange}
              placeholder={profile.sourceInput.placeholder}
              rows={12}
              type="textarea"
              value={source}
            />
          )}
        </Pane>
      </SplitPanel>

      <div className="border-t-2 border-dashed border-gray-900" />

      {belowDividerFormatRadio && messageTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 pl-2">
            <span>Result</span>
            <CopyButton label="result" value={result} />
            <DownloadButton ariaLabel={profile.download.ariaLabel} disabled={!result} onClick={handleDownload} />
          </div>
          <FieldForm
            label=""
            name="format"
            onChange={handleFormatChange}
            options={FORMAT_OPTIONS}
            type="radio"
            value={format}
          />
        </div>
      )}

      <div aria-live="polite" className="flex min-h-0 flex-col gap-2">
        {!belowDividerFormatRadio && (
          <div className="flex items-center gap-1">
            <span>Result</span>
            <CopyButton label="result" value={result} />
            <DownloadButton ariaLabel={profile.download.ariaLabel} disabled={!result} onClick={handleDownload} />
          </div>
        )}
        <CodeOutput placeholder={profile.resultPlaceholder} value={result} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ProtobufCodec — orchestrator. The triad stays untouched.
// ---------------------------------------------------------------------------

export const ProtobufCodec = (_props: ToolComponentProps) => {
  const [action, setAction] = useState<ProtobufCodecAction>('encode')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [persisted, setPersisted] = useInputLocalStorage<PersistedState>(
    'csr-dev-tools-protobuf-codec-input',
    INITIAL_STATE,
  )
  // The user's explicit pick; the effective selection is derived against the
  // latest parse so a schema edit keeps the pick while it still exists.
  const [chosenMessageType, setChosenMessageType] = useState('')
  const showError = useToast((s) => s.showError)

  const update = useCallback(
    (patch: Partial<PersistedState>) => {
      setPersisted((prev) => ({ ...prev, ...patch }))
    },
    [setPersisted],
  )

  const {
    result: schemaResult,
    setInput: setSchemaInput,
    setInputImmediate: setSchemaInputImmediate,
  } = useToolComputation<string, SchemaParseOutput>(
    async (value) => {
      const { parseProtobufSchema } = await import('@/wasm/parsers')
      const parsed = await parseProtobufSchema(value)
      if (parsed.success) {
        return { messageTypes: parsed.schema.messages.map((m) => m.name), toastError: null }
      }
      return { messageTypes: [], toastError: `Schema error: ${parsed.error}` }
    },
    {
      debounceMs: 300,
      errorLabel: 'Failed to parse proto schema',
      initial: { messageTypes: [], toastError: null },
      isEmpty: (value) => !value.trim(),
    },
  )

  const messageTypes = schemaResult.messageTypes
  const selectedMessageType = messageTypes.includes(chosenMessageType) ? chosenMessageType : (messageTypes[0] ?? '')

  // Surface parse-validation toasts on each new parse result.
  useEffect(() => {
    if (schemaResult.toastError) {
      showError(schemaResult.toastError)
    }
    // eslint-disable-next-line react/exhaustive-deps -- toast is stable; intentionally fire only on result change
  }, [schemaResult])

  useMountOnce(() => {
    if (persisted.schema) setSchemaInputImmediate(persisted.schema)
  })

  const handleSchemaChange = useCallback(
    (value: string) => {
      update({ schema: value })
      setSchemaInput(value)
    },
    [update, setSchemaInput],
  )

  const handleMessageTypeChange = useCallback((value: string) => {
    setChosenMessageType(value)
  }, [])

  const openDialog = (act: ProtobufCodecAction) => {
    setAction(act)
    setDialogOpen(true)
  }

  const encodeProps: ContentProps = {
    format: persisted.encodeFormat,
    messageTypes,
    onFormatChange: (v) => update({ encodeFormat: v as OutputFormat }),
    onMessageTypeChange: handleMessageTypeChange,
    onSchemaChange: handleSchemaChange,
    onSourceChange: (v) => update({ encodeSource: v }),
    schema: persisted.schema,
    selectedMessageType,
    source: persisted.encodeSource,
  }

  const decodeProps: ContentProps = {
    format: persisted.decodeFormat,
    messageTypes,
    onFormatChange: (v) => update({ decodeFormat: v as OutputFormat }),
    onMessageTypeChange: handleMessageTypeChange,
    onSchemaChange: handleSchemaChange,
    onSourceChange: (v) => update({ decodeSource: v }),
    schema: persisted.schema,
    selectedMessageType,
    source: persisted.decodeSource,
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('encode')} variant="default">
            Encode
          </Button>
          <Button block onClick={() => openDialog('decode')} variant="default">
            Decode
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        size="screen"
        title={action === 'encode' ? 'Protobuf Encode' : 'Protobuf Decode'}
      >
        {action === 'encode' ? (
          <ProtobufContent direction="encode" {...encodeProps} />
        ) : (
          <ProtobufContent direction="decode" {...decodeProps} />
        )}
      </ToolDialogShell>
    </>
  )
}
