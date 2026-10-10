import { useCallback, useMemo, useState } from 'react'

import { Button, CodeInput, EmptyState, ErrorBanner, TextInput } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolComputationPersisted } from '@/hooks'
import type {
  GraphqlEnumValuesListProps,
  GraphqlFieldsTableProps,
  GraphqlKindBadgeProps,
  GraphqlParseOutput,
  GraphqlTypeDetailPanelProps,
  GraphqlTypeKind,
  GraphqlTypeReferenceProps,
  KindBadgeStyle,
  ToolComponentProps,
} from '@/types'

import { KindBadge, SchemaBrowserLayout } from './schema-browser'

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

const KIND_STYLES: Record<GraphqlTypeKind, KindBadgeStyle> = {
  Enum: { badge: 'border-green-700 bg-green-900/50 text-green-300', label: 'E' },
  Input: { badge: 'border-teal-700 bg-teal-900/50 text-teal-300', label: 'In' },
  Interface: { badge: 'border-purple-700 bg-purple-900/50 text-purple-300', label: 'I' },
  Object: { badge: 'border-blue-700 bg-blue-900/50 text-blue-300', label: 'T' },
  Scalar: { badge: 'border-gray-600 bg-gray-800/50 text-gray-400', label: 'S' },
  Union: { badge: 'border-orange-700 bg-orange-900/50 text-orange-300', label: 'U' },
}

const GraphqlKindBadge = ({ kind }: GraphqlKindBadgeProps) => (
  <KindBadge ariaLabel={`${getTypeKindLabel(kind)} type`} kind={kind} styles={KIND_STYLES} />
)

const TypeReference = ({ onNavigate, typeName }: GraphqlTypeReferenceProps) => (
  <button
    aria-label={`Navigate to type ${typeName}`}
    className="cursor-pointer text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    onClick={() => onNavigate(typeName)}
    type="button"
  >
    {typeName}
  </button>
)

const FieldsTable = ({ fields, onNavigate }: GraphqlFieldsTableProps) => (
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

const EnumValuesList = ({ values }: GraphqlEnumValuesListProps) => (
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

const TypeDetailPanel = ({ onNavigate, type }: GraphqlTypeDetailPanelProps) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <GraphqlKindBadge kind={type.kind} />
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

export const GraphqlSchemaViewer = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const {
    input,
    result: parseResult,
    setInput,
    setInputImmediate,
  } = useToolComputationPersisted<string, GraphqlParseOutput>({
    compute: async (value) => {
      const { parseGraphqlSchema } = await import('@/utils/graphql-schema-viewer')
      const result = parseGraphqlSchema(value)
      if (result.success) {
        return { schema: result.schema, parseError: null }
      }
      return { schema: null, parseError: result.error }
    },
    debounceMs: 300,
    errorLabel: 'Failed to parse schema',
    initial: '',
    initialResult: { schema: null, parseError: null },
    isEmpty: (value) => !value.trim(),
    storageKey: 'csr-dev-tools-graphql-schema-viewer-input',
  })

  const schemaInfo = parseResult.schema
  const error = parseResult.parseError

  const handleChange = (value: string) => setInput(value)

  const handleLoadExample = useCallback(() => {
    setInputImmediate(SAMPLE_SCHEMA)
  }, [setInputImmediate])

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

  const filteredTypes = useMemo(() => {
    const types = schemaInfo?.types ?? []
    if (!filter) return types
    const lowerFilter = filter.toLowerCase()
    return types.filter(
      (type) =>
        type.name.toLowerCase().includes(lowerFilter) ||
        type.fields?.some((f) => f.name.toLowerCase().includes(lowerFilter)) ||
        type.inputFields?.some((f) => f.name.toLowerCase().includes(lowerFilter)) ||
        type.enumValues?.some((v) => v.name.toLowerCase().includes(lowerFilter)),
    )
  }, [filter, schemaInfo])

  const listItems = useMemo(
    () =>
      filteredTypes.map((type) => ({
        ariaLabel: `${type.name} - ${getTypeKindLabel(type.kind)} type`,
        badge: <GraphqlKindBadge kind={type.kind} />,
        id: type.name,
        name: type.name,
      })),
    [filteredTypes],
  )

  // Derived: the selection survives reparses while the type still exists.
  const selectedTypeInfo = useMemo(
    () => schemaInfo?.types.find((t) => t.name === selectedType),
    [schemaInfo, selectedType],
  )

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterClose}
      title="GraphQL Schema Viewer"
      triggers={[{ label: 'Open' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <CodeInput
          aria-label="GraphQL SDL input"
          name="graphql-sdl-input"
          onChange={handleChange}
          placeholder="Paste your GraphQL schema (SDL) here..."
          value={input}
        />

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {!schemaInfo && !error && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <EmptyState>Paste a GraphQL schema to explore its types and fields</EmptyState>
            <Button onClick={handleLoadExample} size="small">
              Load Example Schema
            </Button>
          </div>
        )}

        {schemaInfo && (
          <SchemaBrowserLayout
            detail={
              selectedTypeInfo ? (
                <TypeDetailPanel onNavigate={handleNavigateToType} type={selectedTypeInfo} />
              ) : (
                <p className="py-8 text-center text-body-xs text-gray-500">
                  Select a type from the list to view details
                </p>
              )
            }
            filter={
              <>
                <label className="sr-only" htmlFor="graphql-type-filter">
                  Filter types
                </label>
                <TextInput
                  aria-label="Filter types"
                  id="graphql-type-filter"
                  name="graphql-type-filter"
                  onChange={setFilter}
                  placeholder="Filter types..."
                  type="text"
                  value={filter}
                />
              </>
            }
            list={{
              emptyMessage: 'No types match filter',
              items: listItems,
              onSelect: (item) => setSelectedType(item.id),
              selectedId: selectedTypeInfo?.name ?? null,
            }}
          />
        )}
      </div>
    </ToolDialogFrame>
  )
}
