import { useCallback, useEffect, useRef, useState } from 'react'

import {
  Button,
  CodeInput,
  CodeOutput,
  CopyButton,
  Dialog,
  DownloadIcon,
  FieldForm,
  SelectInput,
  UploadInput,
} from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useInputLocalStorage, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { downloadBinaryFile, downloadTextFile } from '@/utils/file'
import { detectProtobufFormat } from '@/utils/protobuf-codec'
import type { OutputFormat } from '@/utils/protobuf-codec'
import type { Action, PersistedState, ContentProps } from "@/types/components/feature/code/protobufCodec";

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
  { label: 'Raw Binary', value: 'raw' },
]
const DownloadButton = (props: { ariaLabel: string; disabled: boolean; onClick: () => void }) => {
  return (
    <button
      {...props}
      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-body-sm transition-colors hover:bg-gray-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      type="button"
    >
      <DownloadIcon size={16} />
    </button>
  )
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
        const codecResult = await encodeProtobuf(schemaVal, msgType, sourceVal, fmt)
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

  useEffect(() => {
    if (schema && selectedMessageType && source) {
      processEncode(schema, selectedMessageType, source, format)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when messageType becomes available
  }, [selectedMessageType])

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

  const handleUploadJson = useCallback(
    (files: Array<File>) => {
      const file = files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        onSourceChange(text)
        processEncode(schema, selectedMessageType, text, format)
      }
      reader.readAsText(file)
    },
    [onSourceChange, schema, selectedMessageType, format, processEncode],
  )

  const handleDownloadEncoded = useCallback(() => {
    if (!result) return
    const timestamp = Date.now()
    const safeName = selectedMessageType.replace(/[^a-zA-Z0-9-_]/g, '_')
    if (format === 'raw') {
      const bytes = new Uint8Array(result.length)
      for (let i = 0; i < result.length; i++) {
        bytes[i] = result.charCodeAt(i) & 0xff
      }
      downloadBinaryFile(bytes, `encoded_${safeName}_${timestamp}.pb`)
    } else {
      downloadTextFile(result, `encoded_${safeName}_${timestamp}.pb.txt`, 'text/plain')
    }
  }, [result, format, selectedMessageType])

  return (
    <div className="flex w-full grow flex-col gap-4">
      <div className="flex flex-col gap-6 tablet:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-2">
          <SelectInput
            name="message-type-select"
            onChange={handleMessageTypeChange}
            options={messageTypes.map((name) => ({ label: name, value: name }))}
            placeholder="Select message type"
            value={selectedMessageType}
          />
        </div>
        <div className="w-px" />
        <div className="flex flex-1 items-center gap-2">
          <UploadInput
            accept=".json,application/json"
            button={{ children: 'Upload JSON' }}
            multiple={false}
            name="upload-json"
            onChange={handleUploadJson}
          />
        </div>
      </div>
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 pl-2">
            <span>Result</span>
            <CopyButton label="result" value={result} />
            <DownloadButton ariaLabel="Download encoded result" disabled={!result} onClick={handleDownloadEncoded} />
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
        const codecResult = await decodeProtobuf(schemaVal, msgType, sourceVal, fmt)
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

  useEffect(() => {
    if (schema && selectedMessageType && source) {
      processDecode(schema, selectedMessageType, source, format)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when messageType becomes available
  }, [selectedMessageType])

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

  const handleUploadPb = useCallback(
    (files: Array<File>) => {
      const file = files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async () => {
        const buffer = reader.result as ArrayBuffer
        const bytes = new Uint8Array(buffer)
        // Convert to latin1 string (preserves all byte values, unlike UTF-8)
        let raw = ''
        for (const byte of bytes) {
          raw += String.fromCharCode(byte)
        }
        // Try to detect if the content is base64 or hex text
        const textDecoder = new TextDecoder()
        const text = textDecoder.decode(bytes)
        const detected = await detectProtobufFormat(text)
        const value = detected === 'raw' ? raw : text
        onFormatChange(detected)
        onSourceChange(value)
        processDecode(schema, selectedMessageType, value, detected)
        toast({ action: 'add', item: { label: `Auto-detected format: ${detected}`, type: 'success' } })
      }
      reader.readAsArrayBuffer(file)
    },
    [onFormatChange, onSourceChange, schema, selectedMessageType, processDecode, toast],
  )

  const handleDownloadJson = useCallback(() => {
    if (!result) return
    const timestamp = Date.now()
    const safeName = selectedMessageType.replace(/[^a-zA-Z0-9-_]/g, '_')
    downloadTextFile(result, `decoded_${safeName}_${timestamp}.json`, 'application/json')
  }, [result, selectedMessageType])

  return (
    <div className="flex w-full grow flex-col gap-4">
      <div className="flex flex-col gap-6 tablet:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-2">
          <SelectInput
            name="message-type-select"
            onChange={handleMessageTypeChange}
            options={messageTypes.map((name) => ({ label: name, value: name }))}
            placeholder="Select message type"
            size="compact"
            value={selectedMessageType}
          />
        </div>
        <div className="w-px" />
        <div className="flex flex-1 items-center gap-2">
          <FieldForm
            label="Input Format"
            name="format"
            onChange={handleFormatChange}
            options={FORMAT_OPTIONS}
            type="radio"
            value={format}
          />
          <UploadInput
            accept=".pb,.bin,.txt,.protobuf"
            button={{ children: 'Upload .pb' }}
            multiple={false}
            name="upload-pb"
            onChange={handleUploadPb}
          />
        </div>
      </div>
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
        <div className="flex items-center gap-1">
          <span>Result</span>
          <CopyButton label="result" value={result} />
          <DownloadButton ariaLabel="Download decoded JSON" disabled={!result} onClick={handleDownloadJson} />
        </div>
        <CodeOutput placeholder='{ "name": "Alice" }' value={result} />
      </div>
    </div>
  )
}

export const ProtobufCodec = (_props: ToolComponentProps) => {
  const [action, setAction] = useState<Action>('encode')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [persisted, setPersisted] = useInputLocalStorage<PersistedState>(
    'csr-dev-tools-protobuf-codec-input',
    INITIAL_STATE,
  )
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
      const parsed = await parseProtobufSchema(value)
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
