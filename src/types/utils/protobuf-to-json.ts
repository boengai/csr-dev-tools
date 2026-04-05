export type ProtobufFieldInfo = {
  description: string | null
  id: number
  isMap: boolean
  name: string
  resolvedKind: 'enum' | 'message' | 'scalar'
  resolvedTypeName: string | null
  rule: 'optional' | 'repeated' | 'required' | undefined
  type: string
}

export type ProtobufEnumInfo = {
  fullName: string
  name: string
  values: Record<string, number>
}

export type ProtobufMessageInfo = {
  fields: Array<ProtobufFieldInfo>
  fullName: string
  name: string
  nestedEnums: Array<ProtobufEnumInfo>
  nestedMessages: Array<ProtobufMessageInfo>
  oneofs: Array<{ fieldNames: Array<string>; name: string }>
}

export type ProtobufSchemaInfo = {
  enums: Array<ProtobufEnumInfo>
  messages: Array<ProtobufMessageInfo>
  package: string | null
  syntax: string | null
}

export type ProtobufParseResult =
  | { error: string; line: number | null; success: false }
  | { schema: ProtobufSchemaInfo; success: true }
