import { useCallback, useEffect, useState } from 'react'

import { BrowsableItemList, CodeInput, CopyButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputationPersisted } from '@/hooks'
import type { BrowsableEntry, EntryKind, ParseOutput, ToolComponentProps } from '@/types'
import { cnMerge } from '@/utils'
import type { ProtobufEnumInfo, ProtobufMessageInfo, ProtobufSchemaInfo } from '@/wasm/parsers'

const toolEntry = TOOL_REGISTRY_MAP['protobuf-to-json']
const KIND_STYLES: Record<EntryKind, { badge: string; label: string }> = {
  enum: { badge: 'border-green-700 bg-green-900/50 text-green-300', label: 'E' },
  message: { badge: 'border-blue-700 bg-blue-900/50 text-blue-300', label: 'M' },
}

const KindBadge = ({ kind }: { kind: EntryKind }) => {
  const style = KIND_STYLES[kind]
  const kindLabel = kind === 'message' ? 'Message type' : 'Enum type'
  return (
    <span
      aria-label={kindLabel}
      className={cnMerge(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[10px] font-bold',
        style.badge,
      )}
    >
      {style.label}
    </span>
  )
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

function buildBrowsableEntries(schema: ProtobufSchemaInfo): Array<BrowsableEntry> {
  const entries: Array<BrowsableEntry> = []

  const addMessages = (messages: Array<ProtobufMessageInfo>) => {
    for (const msg of messages) {
      entries.push({ fullName: msg.fullName, kind: 'message', messageInfo: msg, name: msg.name })
      addMessages(msg.nestedMessages)
      for (const nestedEnum of msg.nestedEnums) {
        entries.push({ enumInfo: nestedEnum, fullName: nestedEnum.fullName, kind: 'enum', name: nestedEnum.name })
      }
    }
  }

  addMessages(schema.messages)
  for (const enumInfo of schema.enums) {
    entries.push({ enumInfo, fullName: enumInfo.fullName, kind: 'enum', name: enumInfo.name })
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

function collectAllEnumsFlat(schema: ProtobufSchemaInfo): Array<ProtobufEnumInfo> {
  const result = [...schema.enums]
  const traverse = (messages: Array<ProtobufMessageInfo>) => {
    for (const msg of messages) {
      result.push(...msg.nestedEnums)
      traverse(msg.nestedMessages)
    }
  }
  traverse(schema.messages)
  return result
}

function annotateJsonWithEnums(jsonStr: string, allEnums: Array<ProtobufEnumInfo>): Array<string> {
  const enumValueToAllValues = new Map<string, Array<string>>()
  for (const enumInfo of allEnums) {
    const values = Object.keys(enumInfo.values)
    for (const val of values) {
      enumValueToAllValues.set(val, values)
    }
  }

  return jsonStr.split('\n').map((line) => {
    const match = line.match(/^\s*"\w+":\s*"([A-Z_][A-Z0-9_]*)"/)
    if (match) {
      const enumValues = enumValueToAllValues.get(match[1])
      if (enumValues) {
        return `${line} // ${enumValues.join(' | ')}`
      }
    }
    return line
  })
}

export const ProtobufToJson = (_props: ToolComponentProps) => {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [generatedJson, setGeneratedJson] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    input,
    result: parseResult,
    setInput,
    setInputImmediate,
  } = useToolComputationPersisted<string, ParseOutput>({
    compute: async (value) => {
      const { parseProtobufSchema } = await import('@/wasm/parsers')
      const result = await parseProtobufSchema(value)
      if (result.success) {
        return { schema: result.schema, parseError: null }
      }
      return { schema: null, parseError: { line: result.line, message: result.error } }
    },
    debounceMs: 300,
    initial: '',
    initialResult: { schema: null, parseError: null },
    isEmpty: (value) => !value.trim(),
    onError: () => {
      toast({ action: 'add', item: { label: 'Failed to parse proto definition', type: 'error' } })
    },
    storageKey: 'csr-dev-tools-protobuf-to-json-input',
  })

  const schemaInfo = parseResult.schema
  const error = parseResult.parseError

  // When the parse result changes (new schema or error), clear the user's selection.
  useEffect(() => {
    setSelectedEntry(null)
    setGeneratedJson(null)
  }, [parseResult])

  const handleChange = (value: string) => setInput(value)

  const handleLoadExample = useCallback(() => {
    setInputImmediate(SAMPLE_PROTO)
  }, [setInputImmediate])

  const handleSelectEntry = useCallback(
    async (entry: BrowsableEntry) => {
      setSelectedEntry(entry.fullName)

      if (entry.kind === 'message' && schemaInfo) {
        try {
          const { generateSampleJson } = await import('@/wasm/parsers')
          const json = await generateSampleJson(entry.messageInfo, schemaInfo.messages, schemaInfo.enums)
          const jsonStr = JSON.stringify(json, null, 2)
          const allEnums = collectAllEnumsFlat(schemaInfo)
          const annotatedLines = annotateJsonWithEnums(jsonStr, allEnums)
          setGeneratedJson(annotatedLines.join('\n'))
        } catch {
          toast({ action: 'add', item: { label: 'Failed to generate JSON', type: 'error' } })
        }
      } else if (entry.kind === 'enum') {
        const enumDisplay = {
          name: entry.enumInfo.name,
          values: entry.enumInfo.values,
        }
        setGeneratedJson(JSON.stringify(enumDisplay, null, 2))
      }
    },
    [schemaInfo, toast],
  )

  const entries = schemaInfo ? buildBrowsableEntries(schemaInfo) : []

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <CodeInput
        aria-label="Proto definition input"
        name="proto-input"
        onChange={handleChange}
        placeholder="Paste your .proto definition here..."
        value={input}
      />

      {error && (
        <p className="text-red-400 text-body-xs" role="alert">
          {error.line !== null ? `Syntax error at line ${error.line}: ${error.message}` : error.message}
        </p>
      )}

      {!schemaInfo && !error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-body-xs text-gray-500">
            Paste a .proto definition to explore its message types and generate sample JSON
          </p>
          <button
            className="cursor-pointer rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-body-xs text-gray-300 hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            onClick={handleLoadExample}
            type="button"
          >
            Load Example
          </button>
        </div>
      )}

      {schemaInfo && (
        <div className="md:flex-row flex flex-col gap-4">
          <div className="md:w-64 flex w-full shrink-0 flex-col gap-2">
            <BrowsableItemList
              emptyMessage="No message types found"
              items={entries.map((entry) => ({
                ariaLabel: `${entry.name} - ${entry.kind === 'message' ? 'Message' : 'Enum'} type`,
                badge: <KindBadge kind={entry.kind} />,
                id: entry.fullName,
                name: entry.name,
              }))}
              onSelect={(item) => {
                const entry = entries.find((e) => e.fullName === item.id)
                if (entry) handleSelectEntry(entry)
              }}
              selectedId={selectedEntry}
            />
          </div>

          <div aria-live="polite" className="min-w-0 grow">
            {generatedJson ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-body-sm font-semibold text-gray-100">
                    {entries.find((e) => e.fullName === selectedEntry)?.name}
                  </h3>
                  <CopyButton label="Copy JSON" value={generatedJson} />
                </div>
                <pre className="overflow-x-auto rounded border border-gray-800 bg-gray-950 p-4 font-mono text-body-xs text-gray-200">
                  {generatedJson}
                </pre>
              </div>
            ) : (
              <p className="py-8 text-center text-body-xs text-gray-500">
                Select a message from the list to view its JSON structure
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
