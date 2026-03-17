import { useCallback, useEffect, useRef, useState } from 'react'

import { Button, CodeInput, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useInputLocalStorage, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { OutputFormat } from '@/utils/protobuf-codec'

const toolEntry = TOOL_REGISTRY_MAP['protobuf-codec']

type Action = 'decode' | 'encode'

type PersistedState = {
  decodeFormat: OutputFormat
  decodeSource: string
  encodeFormat: OutputFormat
  encodeSource: string
  schema: string
}

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
  { label: 'Raw Binary', value: 'raw' },
]

type MessageTypeSelectProps = {
  messageTypes: Array<string>
  onChange: (value: string) => void
  value: string
}

const MessageTypeSelect = ({ messageTypes, onChange, value }: MessageTypeSelectProps) => (
  <div className="flex items-center gap-2">
    <label className="shrink-0 text-body-xs text-gray-400" htmlFor="message-type-select">
      Message Type
    </label>
    <select
      className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-body-xs text-gray-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      id="message-type-select"
      onChange={(e) => onChange(e.target.value)}
      value={value}
    >
      {messageTypes.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  </div>
)

type ContentProps = {
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

const EncodeContent = ({
  format,
  messageTypes,
  onFormatChange,
  onMessageTypeChange,
  onSchemaChange,
  onSourceChange,
  schema,
  selectedMessageType,
  source,
}: ContentProps) => {
  const [result, setResult] = useState('')
  const { toast } = useToast()

  const processEncode = useDebounceCallback(
    async (schemaVal: string, msgType: string, sourceVal: string, fmt: OutputFormat) => {
      if (!schemaVal.trim() || !msgType || !sourceVal.trim()) {
        setResult('')
        return
      }
      try {
        const { encodeProtobuf } = await import('@/utils/protobuf-codec')
        const codecResult = encodeProtobuf(schemaVal, msgType, sourceVal, fmt)
        if (codecResult.success) {
          setResult(codecResult.output)
        } else {
          setResult('')
          toast({ action: 'add', item: { label: codecResult.error, type: 'error' } })
        }
      } catch {
        setResult('')
        toast({ action: 'add', item: { label: 'Failed to encode protobuf', type: 'error' } })
      }
    },
    300,
  )

  const handleSourceChange = useCallback(
    (value: string) => {
      onSourceChange(value)
      processEncode(schema, selectedMessageType, value, format)
    },
    [onSourceChange, schema, selectedMessageType, format, processEncode],
  )

  const handleFormatChange = useCallback(
    (value: string) => {
      onFormatChange(value)
      if (source) processEncode(schema, selectedMessageType, source, value as OutputFormat)
    },
    [onFormatChange, source, schema, selectedMessageType, processEncode],
  )

  const handleMessageTypeChange = useCallback(
    (value: string) => {
      onMessageTypeChange(value)
      if (source) processEncode(schema, value, source, format)
    },
    [onMessageTypeChange, source, schema, format, processEncode],
  )

  return (
    <div className="flex w-full grow flex-col gap-4">
      {messageTypes.length > 0 && (
        <MessageTypeSelect messageTypes={messageTypes} onChange={handleMessageTypeChange} value={selectedMessageType} />
      )}

      <div className="flex grow flex-col gap-6 tablet:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <CodeInput
            aria-label="Proto schema input"
            name="proto-schema"
            onChange={onSchemaChange}
            placeholder="Paste your .proto definition here..."
            value={schema}
          />
        </div>
        <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <CodeInput
            aria-label="JSON input"
            name="dialog-source"
            onChange={handleSourceChange}
            placeholder='{"name": "Alice", "age": 30}'
            value={source}
          />
        </div>
      </div>
      <div className="border-t-2 border-dashed border-gray-900" />
      {messageTypes.length > 0 && (
        <FieldForm
          label={
            <span className="flex items-center gap-1">
              <span>Result</span>
              <CopyButton label="result" value={result} />
            </span>
          }
          name="format"
          onChange={handleFormatChange}
          options={FORMAT_OPTIONS}
          type="radio"
          value={format}
        />
      )}

      <div aria-live="polite" className="flex min-h-0 flex-col gap-2">
        <CodeOutput placeholder="Encoded output will appear here..." value={result} />
      </div>
    </div>
  )
}

const DecodeContent = ({
  format,
  messageTypes,
  onFormatChange,
  onMessageTypeChange,
  onSchemaChange,
  onSourceChange,
  schema,
  selectedMessageType,
  source,
}: ContentProps) => {
  const [result, setResult] = useState('')
  const { toast } = useToast()

  const processDecode = useDebounceCallback(
    async (schemaVal: string, msgType: string, sourceVal: string, fmt: OutputFormat) => {
      if (!schemaVal.trim() || !msgType || !sourceVal.trim()) {
        setResult('')
        return
      }
      try {
        const { decodeProtobuf } = await import('@/utils/protobuf-codec')
        const codecResult = decodeProtobuf(schemaVal, msgType, sourceVal, fmt)
        if (codecResult.success) {
          setResult(codecResult.output)
        } else {
          setResult('')
          toast({ action: 'add', item: { label: codecResult.error, type: 'error' } })
        }
      } catch {
        setResult('')
        toast({ action: 'add', item: { label: 'Failed to decode protobuf', type: 'error' } })
      }
    },
    300,
  )

  const handleSourceChange = useCallback(
    (value: string) => {
      onSourceChange(value)
      processDecode(schema, selectedMessageType, value, format)
    },
    [onSourceChange, schema, selectedMessageType, format, processDecode],
  )

  const handleFormatChange = useCallback(
    (value: string) => {
      onFormatChange(value)
      if (source) processDecode(schema, selectedMessageType, source, value as OutputFormat)
    },
    [onFormatChange, source, schema, selectedMessageType, processDecode],
  )

  const handleMessageTypeChange = useCallback(
    (value: string) => {
      onMessageTypeChange(value)
      if (source) processDecode(schema, value, source, format)
    },
    [onMessageTypeChange, source, schema, format, processDecode],
  )

  return (
    <div className="flex w-full grow flex-col gap-4">
      {messageTypes.length > 0 && (
        <div className="flex grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-2">
            <MessageTypeSelect messageTypes={messageTypes} onChange={handleMessageTypeChange} value={selectedMessageType} />
          </div>
          <div className="w-px" />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="Input Format"
              name="format"
              onChange={handleFormatChange}
              options={FORMAT_OPTIONS}
              type="radio"
              value={format}
            />
          </div>
        </div>
      )}

      <div className="flex grow flex-col gap-6 tablet:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <CodeInput
            aria-label="Proto schema input"
            name="proto-schema"
            onChange={onSchemaChange}
            placeholder="Paste your .proto definition here..."
            value={schema}
          />
        </div>

        <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <FieldForm
            label=""
            name="dialog-source"
            onChange={handleSourceChange}
            placeholder="Paste encoded protobuf data..."
            rows={12}
            type="textarea"
            value={source}
          />
        </div>
      </div>

      <div className="border-t-2 border-dashed border-gray-900" />

      <div aria-live="polite" className="flex min-h-0 flex-col gap-2">
        <CodeOutput
          label={
            <span className="flex items-center gap-1">
              <span>Result</span>
              <CopyButton label="result" value={result} />
            </span>
          }
          placeholder='{ "name": "Alice" }'
          value={result}
        />
      </div>
    </div>
  )
}

export const ProtobufCodec = (_props: ToolComponentProps) => {
  const [action, setAction] = useState<Action>('encode')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [persisted, setPersisted] = useInputLocalStorage<PersistedState>('csr-dev-tools-protobuf-codec-input', INITIAL_STATE)
  const [messageTypes, setMessageTypes] = useState<Array<string>>([])
  const [selectedMessageType, setSelectedMessageType] = useState('')
  const { toast } = useToast()
  const initializedRef = useRef(false)

  const update = useCallback(
    (patch: Partial<PersistedState>) => {
      setPersisted((prev) => ({ ...prev, ...patch }))
    },
    [setPersisted],
  )

  const parseSchema = useDebounceCallback(async (value: string) => {
    if (!value.trim()) {
      setMessageTypes([])
      setSelectedMessageType('')
      return
    }
    try {
      const { parseProtobufSchema } = await import('@/utils/protobuf-to-json')
      const parsed = parseProtobufSchema(value)
      if (parsed.success) {
        const names = parsed.schema.messages.map((m) => m.name)
        setMessageTypes(names)
        setSelectedMessageType(names[0] ?? '')
      } else {
        setMessageTypes([])
        setSelectedMessageType('')
        toast({ action: 'add', item: { label: `Schema error: ${parsed.error}`, type: 'error' } })
      }
    } catch {
      toast({ action: 'add', item: { label: 'Failed to parse proto schema', type: 'error' } })
    }
  }, 300)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (persisted.schema) parseSchema(persisted.schema)
    }
  }, [parseSchema, persisted.schema])

  const handleSchemaChange = useCallback(
    (value: string) => {
      update({ schema: value })
      parseSchema(value)
    },
    [update, parseSchema],
  )

  const handleMessageTypeChange = useCallback((value: string) => {
    setSelectedMessageType(value)
  }, [])

  const openDialog = (act: Action) => {
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
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('encode')} variant="default">
            Encode
          </Button>
          <Button block onClick={() => openDialog('decode')} variant="default">
            Decode
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        size="screen"
        title={action === 'encode' ? 'Protobuf Encode' : 'Protobuf Decode'}
      >
        {action === 'encode' ? <EncodeContent {...encodeProps} /> : <DecodeContent {...decodeProps} />}
      </Dialog>
    </>
  )
}
