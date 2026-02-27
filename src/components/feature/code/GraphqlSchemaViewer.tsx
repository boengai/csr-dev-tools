import { useCallback, useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { GraphqlSchemaInfo, GraphqlTypeInfo, GraphqlTypeKind } from '@/utils/graphql-schema-viewer'

import { CodeInput, TextInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useLocalStorage, useToast } from '@/hooks'
const toolEntry = TOOL_REGISTRY_MAP['graphql-schema-viewer']

const getTypeKindLabel = (kind: GraphqlTypeKind): string => {
  const labels: Record<GraphqlTypeKind, string> = {
    Enum: 'Enum',
    Input: 'Input Object',
    Interface: 'Interface',
    Object: 'Object',
    Scalar: 'Scalar',
    Union: 'Union',
  }
  return labels[kind]
}

const KIND_STYLES: Record<GraphqlTypeKind, { badge: string; label: string }> = {
  Enum: { badge: 'border-green-700 bg-green-900/50 text-green-300', label: 'E' },
  Input: { badge: 'border-teal-700 bg-teal-900/50 text-teal-300', label: 'In' },
  Interface: { badge: 'border-purple-700 bg-purple-900/50 text-purple-300', label: 'I' },
  Object: { badge: 'border-blue-700 bg-blue-900/50 text-blue-300', label: 'T' },
  Scalar: { badge: 'border-gray-600 bg-gray-800/50 text-gray-400', label: 'S' },
  Union: { badge: 'border-orange-700 bg-orange-900/50 text-orange-300', label: 'U' },
}

const KindBadge = ({ kind }: { kind: GraphqlTypeKind }) => {
  const style = KIND_STYLES[kind]
  return (
    <span
      aria-label={`${getTypeKindLabel(kind)} type`}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${style.badge}`}
    >
      {style.label}
    </span>
  )
}

const TypeReference = ({ onNavigate, typeName }: { onNavigate: (name: string) => void; typeName: string }) => (
  <button
    aria-label={`Navigate to type ${typeName}`}
    className="cursor-pointer text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    onClick={() => onNavigate(typeName)}
    type="button"
  >
    {typeName}
  </button>
)

const FieldsTable = ({
  fields,
  onNavigate,
}: {
  fields: NonNullable<GraphqlTypeInfo['fields']>
  onNavigate: (name: string) => void
}) => (
  <div className="flex flex-col gap-1">
    {fields.map((field) => (
      <div className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 px-3 py-2" key={field.name}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-body-xs font-medium text-gray-200">{field.name}</span>
          {field.args.length > 0 && (
            <span className="font-mono text-body-xs text-gray-500">
              (
              {field.args.map((a, i) => (
                <span key={a.name}>
                  {i > 0 && ', '}
                  {a.name}: <TypeReference onNavigate={onNavigate} typeName={a.formattedType} />
                  {a.defaultValue !== null && <span className="text-gray-600"> = {a.defaultValue}</span>}
                </span>
              ))}
              )
            </span>
          )}
          <span className="text-body-xs text-gray-500">→</span>
          <span className="font-mono text-body-xs">
            <TypeReference onNavigate={onNavigate} typeName={field.formattedType} />
          </span>
          {field.deprecationReason && (
            <span className="border-amber-800 bg-amber-900/50 text-amber-400 rounded border px-1.5 py-0.5 text-[10px] font-medium">
              Deprecated
            </span>
          )}
        </div>
        {field.description && <p className="text-body-xs text-gray-500">{field.description}</p>}
        {field.deprecationReason && (
          <p className="text-amber-500/70 text-body-xs">Deprecated: {field.deprecationReason}</p>
        )}
      </div>
    ))}
  </div>
)

const EnumValuesList = ({ values }: { values: NonNullable<GraphqlTypeInfo['enumValues']> }) => (
  <div className="flex flex-col gap-1">
    {values.map((value) => (
      <div className="flex flex-col gap-1 rounded border border-gray-800 bg-gray-950 px-3 py-2" key={value.name}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-body-xs font-medium text-gray-200">{value.name}</span>
          {value.deprecationReason && (
            <span className="border-amber-800 bg-amber-900/50 text-amber-400 rounded border px-1.5 py-0.5 text-[10px] font-medium">
              Deprecated
            </span>
          )}
        </div>
        {value.description && <p className="text-body-xs text-gray-500">{value.description}</p>}
        {value.deprecationReason && (
          <p className="text-amber-500/70 text-body-xs">Deprecated: {value.deprecationReason}</p>
        )}
      </div>
    ))}
  </div>
)

const TypeDetailPanel = ({ onNavigate, type }: { onNavigate: (name: string) => void; type: GraphqlTypeInfo }) => (
  <div aria-live="polite" className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <KindBadge kind={type.kind} />
      <h3 className="text-body-sm font-semibold text-gray-100">{type.name}</h3>
      <span className="text-body-xs text-gray-500">{getTypeKindLabel(type.kind)}</span>
    </div>

    {type.description && <p className="text-body-xs text-gray-400">{type.description}</p>}

    {type.interfaces && type.interfaces.length > 0 && (
      <div className="flex flex-wrap items-center gap-1 text-body-xs text-gray-500">
        <span>Implements:</span>
        {type.interfaces.map((name, i) => (
          <span key={name}>
            {i > 0 && ', '}
            <TypeReference onNavigate={onNavigate} typeName={name} />
          </span>
        ))}
      </div>
    )}

    {type.fields && type.fields.length > 0 && (
      <div className="flex flex-col gap-2">
        <h4 className="text-body-xs font-medium text-gray-300">Fields</h4>
        <FieldsTable fields={type.fields} onNavigate={onNavigate} />
      </div>
    )}

    {type.inputFields && type.inputFields.length > 0 && (
      <div className="flex flex-col gap-2">
        <h4 className="text-body-xs font-medium text-gray-300">Input Fields</h4>
        <FieldsTable fields={type.inputFields} onNavigate={onNavigate} />
      </div>
    )}

    {type.enumValues && type.enumValues.length > 0 && (
      <div className="flex flex-col gap-2">
        <h4 className="text-body-xs font-medium text-gray-300">Values</h4>
        <EnumValuesList values={type.enumValues} />
      </div>
    )}

    {type.possibleTypes && type.possibleTypes.length > 0 && (
      <div className="flex flex-col gap-2">
        <h4 className="text-body-xs font-medium text-gray-300">Possible Types</h4>
        <div className="flex flex-wrap gap-2">
          {type.possibleTypes.map((name) => (
            <TypeReference key={name} onNavigate={onNavigate} typeName={name} />
          ))}
        </div>
      </div>
    )}
  </div>
)

const SAMPLE_SCHEMA = `type Query {
  user(id: ID!): User
  users(limit: Int = 10): [User!]!
  search(query: String!): [SearchResult!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

"""A user in the system"""
type User implements Node {
  id: ID!
  name: String!
  email: String!
  role: Role!
  posts: [Post!]!
}

type Post implements Node {
  id: ID!
  title: String!
  content: String!
  author: User!
  status: PostStatus!
}

interface Node {
  id: ID!
}

union SearchResult = User | Post

enum Role {
  ADMIN
  USER
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED @deprecated(reason: "Use DRAFT instead")
}

input CreateUserInput {
  name: String!
  email: String!
  role: Role = USER
}

scalar DateTime`

export const GraphqlSchemaViewer = (_props: ToolComponentProps) => {
  const [input, setInput] = useLocalStorage('csr-dev-tools-graphql-schema-viewer-input', '')
  const [schemaInfo, setSchemaInfo] = useState<GraphqlSchemaInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const { toast } = useToast()
  const initializedRef = useRef(false)

  const handleParse = useDebounceCallback(async (value: string) => {
    if (!value.trim()) {
      setSchemaInfo(null)
      setError(null)
      setSelectedType(null)
      return
    }
    try {
      const { parseGraphqlSchema } = await import('@/utils/graphql-schema-viewer')
      const result = parseGraphqlSchema(value)
      if (result.success) {
        setSchemaInfo(result.schema)
        setError(null)
        setSelectedType(null)
      } else {
        setSchemaInfo(null)
        setError(result.error)
        setSelectedType(null)
      }
    } catch {
      toast({ action: 'add', item: { label: 'Failed to parse schema', type: 'error' } })
    }
  }, 300)

  const handleChange = (value: string) => {
    setInput(value)
    handleParse(value)
  }

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (input) handleParse(input)
    }
  }, [handleParse, input])

  const handleLoadExample = useCallback(() => {
    setInput(SAMPLE_SCHEMA)
    handleParse(SAMPLE_SCHEMA)
  }, [handleParse])

  const handleNavigateToType = useCallback(
    (typeName: string) => {
      // Strip non-null and list markers for navigation
      const cleanName = typeName.replace(/[[\]!]/g, '')
      const exists = schemaInfo?.types.some((t) => t.name === cleanName)
      if (exists) {
        setSelectedType(cleanName)
      }
    },
    [schemaInfo],
  )

  const filteredTypes = schemaInfo?.types.filter((type) => {
    if (!filter) return true
    const lowerFilter = filter.toLowerCase()
    if (type.name.toLowerCase().includes(lowerFilter)) return true
    if (type.fields?.some((f) => f.name.toLowerCase().includes(lowerFilter))) return true
    if (type.inputFields?.some((f) => f.name.toLowerCase().includes(lowerFilter))) return true
    if (type.enumValues?.some((v) => v.name.toLowerCase().includes(lowerFilter))) return true
    return false
  })

  const selectedTypeInfo = schemaInfo?.types.find((t) => t.name === selectedType)

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <CodeInput
        aria-label="GraphQL SDL input"
        name="graphql-sdl-input"
        onChange={handleChange}
        placeholder="Paste your GraphQL schema (SDL) here..."
        value={input}
      />

      {error && (
        <p className="text-red-400 text-body-xs" role="alert">
          {error}
        </p>
      )}

      {!schemaInfo && !error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-body-xs text-gray-500">Paste a GraphQL schema to explore its types and fields</p>
          <button
            className="cursor-pointer rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-body-xs text-gray-300 hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            onClick={handleLoadExample}
            type="button"
          >
            Load Example Schema
          </button>
        </div>
      )}

      {schemaInfo && (
        <div className="md:flex-row flex flex-col gap-4">
          <div className="md:w-64 flex w-full shrink-0 flex-col gap-2">
            <label className="sr-only" htmlFor="graphql-type-filter">
              Filter types
            </label>
            <TextInput
              aria-label="Filter types"
              name="graphql-type-filter"
              onChange={setFilter}
              placeholder="Filter types..."
              type="text"
              value={filter}
            />

            <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
              {filteredTypes && filteredTypes.length > 0 ? (
                filteredTypes.map((type) => (
                  <button
                    aria-current={selectedType === type.name ? 'true' : undefined}
                    aria-label={`${type.name} - ${getTypeKindLabel(type.kind)} type`}
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      selectedType === type.name
                        ? 'bg-gray-800 text-gray-100'
                        : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                    }`}
                    key={type.name}
                    onClick={() => setSelectedType(type.name)}
                    type="button"
                  >
                    <KindBadge kind={type.kind} />
                    <span className="truncate text-body-xs">{type.name}</span>
                  </button>
                ))
              ) : (
                <p className="px-2 py-4 text-body-xs text-gray-500">No types match filter</p>
              )}
            </div>
          </div>

          <div className="min-w-0 grow">
            {selectedTypeInfo ? (
              <TypeDetailPanel onNavigate={handleNavigateToType} type={selectedTypeInfo} />
            ) : (
              <p className="py-8 text-center text-body-xs text-gray-500">Select a type from the list to view details</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
