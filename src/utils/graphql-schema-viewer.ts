import type { GraphQLArgument, GraphQLField, GraphQLInputField, GraphQLNamedType } from 'graphql'

import {
  GraphQLError,
  buildSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql'

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

const BUILT_IN_SCALARS = ['Boolean', 'Float', 'ID', 'Int', 'String']

const unwrapType = (type: {
  ofType?: unknown
  toString: () => string
}): { formattedType: string; isList: boolean; isNonNull: boolean; typeName: string } => {
  const formattedType = type.toString()
  const isNonNull = formattedType.endsWith('!')
  const isList = formattedType.includes('[')
  const typeName = formattedType.replace(/[[\]!]/g, '')

  return { formattedType, isList, isNonNull, typeName }
}

const extractArgs = (args: ReadonlyArray<GraphQLArgument>): Array<GraphqlArgInfo> =>
  args.map((arg) => {
    const { formattedType, isList, isNonNull, typeName } = unwrapType(arg.type)
    return {
      defaultValue: arg.defaultValue !== undefined ? JSON.stringify(arg.defaultValue) : null,
      description: arg.description ?? null,
      formattedType,
      isList,
      isNonNull,
      name: arg.name,
      typeName,
    }
  })

const extractFields = (
  fields: Record<string, GraphQLField<unknown, unknown>> | Record<string, GraphQLInputField>,
  typeMap: Record<string, GraphQLNamedType>,
): Array<GraphqlFieldInfo> =>
  Object.values(fields).map((field) => {
    const { formattedType, isList, isNonNull, typeName } = unwrapType(field.type)
    const referencedType = typeMap[typeName]
    return {
      args: 'args' in field ? extractArgs(field.args) : [],
      deprecationReason: 'deprecationReason' in field ? (field.deprecationReason ?? null) : null,
      description: field.description ?? null,
      formattedType,
      isList,
      isNonNull,
      name: field.name,
      typeKind: referencedType ? getTypeKind(referencedType) : 'Scalar',
      typeName,
    }
  })

const getTypeKind = (type: GraphQLNamedType): GraphqlTypeKind => {
  if (isObjectType(type)) return 'Object'
  if (isInterfaceType(type)) return 'Interface'
  if (isUnionType(type)) return 'Union'
  if (isEnumType(type)) return 'Enum'
  if (isInputObjectType(type)) return 'Input'
  if (isScalarType(type)) return 'Scalar'
  return 'Scalar'
}

const extractTypeInfo = (type: GraphQLNamedType, typeMap: Record<string, GraphQLNamedType>): GraphqlTypeInfo => {
  const kind = getTypeKind(type)
  const info: GraphqlTypeInfo = {
    description: type.description ?? null,
    enumValues: null,
    fields: null,
    inputFields: null,
    interfaces: null,
    kind,
    name: type.name,
    possibleTypes: null,
  }

  if (isObjectType(type) || isInterfaceType(type)) {
    info.fields = extractFields(type.getFields(), typeMap)
  }

  if (isObjectType(type)) {
    info.interfaces = type.getInterfaces().map((i) => i.name)
  }

  if (isEnumType(type)) {
    info.enumValues = type.getValues().map((v) => ({
      deprecationReason: v.deprecationReason ?? null,
      description: v.description ?? null,
      name: v.name,
    }))
  }

  if (isUnionType(type)) {
    info.possibleTypes = type.getTypes().map((t) => t.name)
  }

  if (isInputObjectType(type)) {
    info.inputFields = extractFields(type.getFields(), typeMap)
  }

  return info
}

export const parseGraphqlSchema = (sdl: string): GraphqlParseResult => {
  if (!sdl.trim()) {
    return { error: 'Input is empty', success: false }
  }

  try {
    const schema = buildSchema(sdl)
    const typeMap = schema.getTypeMap()

    const userTypes = Object.values(typeMap)
      .filter((type) => !type.name.startsWith('__') && !BUILT_IN_SCALARS.includes(type.name))
      .sort((a, b) => a.name.localeCompare(b.name))

    const types = userTypes.map((t) => extractTypeInfo(t, typeMap))

    return {
      schema: {
        mutationTypeName: schema.getMutationType()?.name ?? null,
        queryTypeName: schema.getQueryType()?.name ?? null,
        subscriptionTypeName: schema.getSubscriptionType()?.name ?? null,
        types,
      },
      success: true,
    }
  } catch (error) {
    if (error instanceof GraphQLError) {
      const line = error.locations?.[0]?.line
      const message = line ? `Syntax error at line ${line}: ${error.message}` : error.message
      return { error: message, success: false }
    }
    return { error: 'Failed to parse GraphQL schema', success: false }
  }
}

export const getTypeKindLabel = (kind: GraphqlTypeKind): string => {
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

export const formatGraphqlType = (typeName: string, isNonNull: boolean, isList: boolean): string => {
  if (isList) {
    return isNonNull ? `[${typeName}!]!` : `[${typeName}]`
  }
  return isNonNull ? `${typeName}!` : typeName
}
