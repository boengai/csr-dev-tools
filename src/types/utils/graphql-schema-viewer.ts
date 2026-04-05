export type GraphqlTypeKind = 'Enum' | 'Input' | 'Interface' | 'Object' | 'Scalar' | 'Union'

export type GraphqlArgInfo = {
  defaultValue: string | null
  description: string | null
  formattedType: string
  isList: boolean
  isNonNull: boolean
  name: string
  typeName: string
}

export type GraphqlEnumValue = {
  deprecationReason: string | null
  description: string | null
  name: string
}

export type GraphqlFieldInfo = {
  args: Array<GraphqlArgInfo>
  deprecationReason: string | null
  description: string | null
  formattedType: string
  isList: boolean
  isNonNull: boolean
  name: string
  typeKind: string
  typeName: string
}

export type GraphqlTypeInfo = {
  description: string | null
  enumValues: Array<GraphqlEnumValue> | null
  fields: Array<GraphqlFieldInfo> | null
  inputFields: Array<GraphqlFieldInfo> | null
  interfaces: Array<string> | null
  kind: GraphqlTypeKind
  name: string
  possibleTypes: Array<string> | null
}

export type GraphqlSchemaInfo = {
  mutationTypeName: string | null
  queryTypeName: string | null
  subscriptionTypeName: string | null
  types: Array<GraphqlTypeInfo>
}

export type GraphqlParseResult = { error: string; success: false } | { schema: GraphqlSchemaInfo; success: true }
