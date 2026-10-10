import type { GraphqlSchemaInfo, GraphqlTypeInfo, GraphqlTypeKind } from '@/types/utils/graphql-schema-viewer'

export type GraphqlParseOutput = {
  parseError: string | null
  schema: GraphqlSchemaInfo | null
}

export type GraphqlTypeReferenceProps = { onNavigate: (name: string) => void; typeName: string }

export type GraphqlKindBadgeProps = { kind: GraphqlTypeKind }

export type GraphqlFieldsTableProps = {
  fields: NonNullable<GraphqlTypeInfo['fields']>
  onNavigate: (name: string) => void
}

export type GraphqlEnumValuesListProps = { values: NonNullable<GraphqlTypeInfo['enumValues']> }

export type GraphqlTypeDetailPanelProps = { onNavigate: (name: string) => void; type: GraphqlTypeInfo }
