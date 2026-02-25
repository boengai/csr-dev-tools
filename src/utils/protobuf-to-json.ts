import * as protobuf from 'protobufjs'

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

const SCALAR_DEFAULTS: Record<string, unknown> = {
  bool: false,
  bytes: '',
  double: 0,
  fixed32: 0,
  fixed64: '0',
  float: 0,
  int32: 0,
  int64: '0',
  sfixed32: 0,
  sfixed64: '0',
  sint32: 0,
  sint64: '0',
  string: '',
  uint32: 0,
  uint64: '0',
}

function extractEnumInfo(enumType: protobuf.Enum): ProtobufEnumInfo {
  return {
    fullName: enumType.fullName,
    name: enumType.name,
    values: { ...enumType.values },
  }
}

function extractFieldInfo(field: protobuf.Field): ProtobufFieldInfo {
  field.resolve()

  let resolvedKind: 'enum' | 'message' | 'scalar' = 'scalar'
  let resolvedTypeName: string | null = null

  if (field.resolvedType instanceof protobuf.Type) {
    resolvedKind = 'message'
    resolvedTypeName = field.resolvedType.fullName
  } else if (field.resolvedType instanceof protobuf.Enum) {
    resolvedKind = 'enum'
    resolvedTypeName = field.resolvedType.fullName
  }

  return {
    description: field.comment ?? null,
    id: field.id,
    isMap: field.map,
    name: field.name,
    resolvedKind,
    resolvedTypeName,
    rule: field.repeated ? 'repeated' : field.required ? 'required' : field.optional ? 'optional' : undefined,
    type: field.type,
  }
}

function extractMessageInfo(messageType: protobuf.Type): ProtobufMessageInfo {
  const fields = messageType.fieldsArray.map(extractFieldInfo)

  const nestedMessages: Array<ProtobufMessageInfo> = []
  const nestedEnums: Array<ProtobufEnumInfo> = []

  for (const nested of messageType.nestedArray) {
    if (nested instanceof protobuf.Type) {
      nestedMessages.push(extractMessageInfo(nested))
    } else if (nested instanceof protobuf.Enum) {
      nestedEnums.push(extractEnumInfo(nested))
    }
  }

  const oneofs = messageType.oneofsArray.map((oneof) => ({
    fieldNames: oneof.fieldsArray.map((f) => f.name),
    name: oneof.name,
  }))

  return {
    fields,
    fullName: messageType.fullName,
    name: messageType.name,
    nestedEnums,
    nestedMessages,
    oneofs,
  }
}

function collectAllMessages(messages: Array<ProtobufMessageInfo>): Array<ProtobufMessageInfo> {
  const result: Array<ProtobufMessageInfo> = []
  for (const msg of messages) {
    result.push(msg)
    result.push(...collectAllMessages(msg.nestedMessages))
  }
  return result
}

function collectAllEnums(
  messages: Array<ProtobufMessageInfo>,
  topLevelEnums: Array<ProtobufEnumInfo>,
): Array<ProtobufEnumInfo> {
  const result = [...topLevelEnums]
  for (const msg of messages) {
    result.push(...msg.nestedEnums)
    result.push(...collectAllEnums(msg.nestedMessages, []))
  }
  return result
}

export function parseProtobufSchema(protoSource: string): ProtobufParseResult {
  const trimmed = protoSource.trim()
  if (!trimmed) {
    return { error: 'Empty input — paste a .proto definition to parse', line: null, success: false }
  }

  try {
    const parsed = protobuf.parse(trimmed)
    const root = parsed.root
    root.resolveAll()

    const syntaxMatch = trimmed.match(/^syntax\s*=\s*"([^"]+)"/m)
    const syntax = syntaxMatch ? syntaxMatch[1] : null

    const messages: Array<ProtobufMessageInfo> = []
    const enums: Array<ProtobufEnumInfo> = []

    for (const nested of root.nestedArray) {
      if (nested instanceof protobuf.Type) {
        messages.push(extractMessageInfo(nested))
      } else if (nested instanceof protobuf.Enum) {
        enums.push(extractEnumInfo(nested))
      } else if (nested instanceof protobuf.Namespace) {
        for (const child of nested.nestedArray) {
          if (child instanceof protobuf.Type) {
            messages.push(extractMessageInfo(child))
          } else if (child instanceof protobuf.Enum) {
            enums.push(extractEnumInfo(child))
          }
        }
      }
    }

    return {
      schema: {
        enums,
        messages,
        package: parsed.package ?? null,
        syntax,
      },
      success: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const lineMatch = message.match(/line (\d+)/)
    const line = lineMatch ? parseInt(lineMatch[1], 10) : null
    return { error: message, line, success: false }
  }
}

export function generateSampleJson(
  message: ProtobufMessageInfo,
  allMessages: Array<ProtobufMessageInfo>,
  allEnums: Array<ProtobufEnumInfo>,
  visited?: Set<string>,
): Record<string, unknown> {
  const seen = visited ?? new Set<string>()
  seen.add(message.fullName)

  const flatMessages = collectAllMessages(allMessages)
  const flatEnums = collectAllEnums(allMessages, allEnums)

  const result: Record<string, unknown> = {}

  for (const field of message.fields) {
    let value: unknown

    if (field.isMap) {
      value = {}
    } else if (field.resolvedKind === 'enum') {
      const enumInfo = flatEnums.find((e) => e.fullName === field.resolvedTypeName)
      if (enumInfo) {
        const firstKey = Object.keys(enumInfo.values)[0]
        value = firstKey ?? ''
      } else {
        value = ''
      }
    } else if (field.resolvedKind === 'message') {
      const nestedMsg = flatMessages.find((m) => m.fullName === field.resolvedTypeName)
      if (nestedMsg && !seen.has(nestedMsg.fullName)) {
        value = generateSampleJson(nestedMsg, allMessages, allEnums, new Set(seen))
      } else {
        value = {}
      }
    } else {
      value = SCALAR_DEFAULTS[field.type] ?? null
    }

    result[field.name] = field.rule === 'repeated' ? [value] : value
  }

  return result
}
