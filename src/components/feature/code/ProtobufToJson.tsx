import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button, CodeInput, CopyButton, EmptyState, ErrorBanner } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useStaleSafeAsync, useToast, useToolInput } from '@/hooks'
import type {
  EntryKind,
  KindBadgeStyle,
  ParseOutput,
  ProtobufMessageInfo,
  ProtobufSampleJson,
  ToolComponentProps,
} from '@/types'
import { annotateJsonWithEnums, buildBrowsableEntries } from '@/utils'

import { KindBadge, SchemaBrowserLayout } from './schema-browser'

const toolEntry = TOOL_REGISTRY_MAP['protobuf-to-json']
const KIND_STYLES: Record<EntryKind, KindBadgeStyle> = {
  enum: { badge: 'border-green-700 bg-green-900/50 text-green-300', label: 'E' },
  message: { badge: 'border-blue-700 bg-blue-900/50 text-blue-300', label: 'M' },
}

const SAMPLE_PROTO = `syntax = "proto3";

package example;

message Person {
  string name = 1;
  int32 age = 2;
  bool active = 3;
  repeated string tags = 4;
  Address address = 5;
  Status status = 6;
  map<string, string> metadata = 7;

  enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
    INACTIVE = 2;
  }
}

message Address {
  string street = 1;
  string city = 2;
  string zip_code = 3;
  string country = 4;
}

message Order {
  string order_id = 1;
  Person customer = 2;
  repeated OrderItem items = 3;
  double total = 4;
  int64 created_at = 5;
}

message OrderItem {
  string product_name = 1;
  int32 quantity = 2;
  float price = 3;
}

enum PaymentMethod {
  CREDIT_CARD = 0;
  DEBIT_CARD = 1;
  PAYPAL = 2;
  CRYPTO = 3;
}`

export const ProtobufToJson = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  // Sample JSON for a message, matched to the selection by `fullName`. A reparse
  // hands us new message objects; matching on the name keeps the detail pane on
  // the current sample (instead of flashing the placeholder) until the
  // regenerated one lands, while a different selection never shows it. The
  // sample is annotated with the message/schema it was generated from.
  const [sample, setSample] = useState<ProtobufSampleJson | null>(null)
  const newSession = useStaleSafeAsync()
  const showError = useToast((s) => s.showError)

  const {
    input,
    result: parseResult,
    setInput,
    setInputImmediate,
  } = useToolInput<string, ParseOutput>({
    compute: async (value) => {
      const { parseProtobufSchema } = await import('@/wasm/parsers')
      const result = await parseProtobufSchema(value)
      if (result.success) {
        return { schema: result.schema, parseError: null }
      }
      return { schema: null, parseError: { line: result.line, message: result.error } }
    },
    debounceMs: 300,
    errorLabel: 'Failed to parse proto definition',
    initial: '',
    initialResult: { schema: null, parseError: null },
    isEmpty: (value) => !value.trim(),
    storageKey: 'csr-dev-tools-protobuf-to-json-input',
  })

  const schemaInfo = parseResult.schema
  const error = parseResult.parseError

  const entries = useMemo(() => (schemaInfo ? buildBrowsableEntries(schemaInfo) : []), [schemaInfo])
  // Derived: the selection survives reparses while the entry still exists.
  const selectedEntry = useMemo(() => entries.find((e) => e.fullName === selectedName), [entries, selectedName])
  const selectedMessage: ProtobufMessageInfo | null =
    selectedEntry?.kind === 'message' ? selectedEntry.messageInfo : null

  // (Re)generate the sample whenever the selected message changes — including
  // when a reparse hands us a new object for the same message. Every run bumps
  // the session, so a slow generation for a previous selection/schema can't
  // land on top of a newer one (or on an enum selection).
  useEffect(() => {
    const session = newSession()
    if (!selectedMessage || !schemaInfo) return
    void (async () => {
      try {
        const { generateSampleJson } = await import('@/wasm/parsers')
        const json = await generateSampleJson(selectedMessage, schemaInfo.messages, schemaInfo.enums)
        session.ifFresh(() => setSample({ json, message: selectedMessage, schema: schemaInfo }))
      } catch {
        session.ifFresh(() => showError('Failed to generate JSON'))
      }
    })()
  }, [newSession, schemaInfo, selectedMessage, showError])

  const output = useMemo(() => {
    if (selectedEntry?.kind === 'enum') {
      const json = JSON.stringify({ name: selectedEntry.enumInfo.name, values: selectedEntry.enumInfo.values }, null, 2)
      return { copy: json, display: json }
    }
    if (selectedMessage && sample?.message.fullName === selectedMessage.fullName) {
      return {
        copy: JSON.stringify(sample.json, null, 2),
        display: annotateJsonWithEnums(sample.json, sample.message, sample.schema),
      }
    }
    return null
  }, [sample, selectedEntry, selectedMessage])

  const handleChange = (value: string) => setInput(value)

  const handleLoadExample = useCallback(() => {
    setInputImmediate(SAMPLE_PROTO)
  }, [setInputImmediate])

  const listItems = useMemo(
    () =>
      entries.map((entry) => {
        const kindLabel = entry.kind === 'message' ? 'Message' : 'Enum'
        return {
          ariaLabel: `${entry.name} - ${kindLabel} type`,
          badge: <KindBadge ariaLabel={`${kindLabel} type`} kind={entry.kind} styles={KIND_STYLES} />,
          id: entry.fullName,
          name: entry.name,
        }
      }),
    [entries],
  )

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      title="Protobuf to JSON"
      triggers={[{ label: 'Open' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <CodeInput
          aria-label="Proto definition input"
          name="proto-input"
          onChange={handleChange}
          placeholder="Paste your .proto definition here..."
          value={input}
        />

        {error && (
          <ErrorBanner>
            {error.line !== null ? `Syntax error at line ${error.line}: ${error.message}` : error.message}
          </ErrorBanner>
        )}

        {!schemaInfo && !error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <EmptyState>Paste a .proto definition to explore its message types and generate sample JSON</EmptyState>
            <Button onClick={handleLoadExample} size="small">
              Load Example
            </Button>
          </div>
        )}

        {schemaInfo && (
          <SchemaBrowserLayout
            detail={
              output ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-body-sm font-semibold text-gray-100">{selectedEntry?.name}</h3>
                    <CopyButton label="Copy JSON" value={output.copy} />
                  </div>
                  <pre className="overflow-x-auto rounded border border-gray-800 bg-gray-950 p-4 font-mono text-body-xs text-gray-200">
                    {output.display}
                  </pre>
                </div>
              ) : (
                <p className="py-8 text-center text-body-xs text-gray-500">
                  Select a message from the list to view its JSON structure
                </p>
              )
            }
            list={{
              emptyMessage: 'No message types found',
              items: listItems,
              onSelect: (item) => setSelectedName(item.id),
              selectedId: selectedEntry?.fullName ?? null,
            }}
          />
        )}
      </div>
    </ToolDialogFrame>
  )
}
