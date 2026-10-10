import type {
  BrowsableEntry,
  ProtobufEnumInfo,
  ProtobufFieldTypeResolver,
  ProtobufMessageInfo,
  ProtobufSchemaInfo,
} from '@/types'

/**
 * Flattens a parsed schema into the sorted list of browsable entries
 * (every message and enum, including nested ones).
 */
export const buildBrowsableEntries = (schema: ProtobufSchemaInfo): Array<BrowsableEntry> => {
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

/** Every enum in the schema, top-level and nested, in declaration order. */
export const collectAllEnumsFlat = (schema: ProtobufSchemaInfo): Array<ProtobufEnumInfo> => {
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

const collectAllMessagesFlat = (messages: Array<ProtobufMessageInfo>): Array<ProtobufMessageInfo> =>
  messages.flatMap((msg) => [msg, ...collectAllMessagesFlat(msg.nestedMessages)])

const renderValue = (
  value: unknown,
  message: ProtobufMessageInfo | null,
  resolver: ProtobufFieldTypeResolver,
): Array<string> => {
  if (value === null || typeof value !== 'object') return [JSON.stringify(value)]

  if (Array.isArray(value)) {
    if (value.length === 0) return ['[]']
    // Arrays only reach here as message-typed elements; enum arrays are handled by the caller.
    const lines = ['[']
    value.forEach((item, i) => {
      const child = renderValue(item, message, resolver)
      if (i < value.length - 1) child[child.length - 1] += ','
      lines.push(...child.map((l) => `  ${l}`))
    })
    lines.push(']')
    return lines
  }

  const entries = Object.entries(value)
  if (entries.length === 0) return ['{}']

  const lines = ['{']
  entries.forEach(([key, fieldValue], i) => {
    const field = message?.fields.find((f) => f.name === key) ?? null
    const isLast = i === entries.length - 1
    const enumValues = field && !field.isMap ? resolver.enumValues(field) : null
    let child: Array<string>
    if (enumValues && Array.isArray(fieldValue)) {
      // Repeated enum: annotate every element.
      child =
        fieldValue.length === 0
          ? ['[]']
          : [
              '[',
              ...fieldValue.map(
                (item, j) =>
                  `  ${JSON.stringify(item)}${j < fieldValue.length - 1 ? ',' : ''} // ${enumValues.join(' | ')}`,
              ),
              ']',
            ]
      child[0] = `${JSON.stringify(key)}: ${child[0]}`
      if (!isLast) child[child.length - 1] += ','
    } else {
      const nested = field && !field.isMap ? resolver.message(field) : null
      child = renderValue(fieldValue, nested, resolver)
      child[0] = `${JSON.stringify(key)}: ${child[0]}`
      if (!isLast) child[child.length - 1] += ','
      if (enumValues && typeof fieldValue === 'string') child[0] += ` // ${enumValues.join(' | ')}`
    }
    lines.push(...child.map((l) => `  ${l}`))
  })
  lines.push('}')
  return lines
}

/**
 * Pretty-prints a sample JSON value (2-space indent, like `JSON.stringify`)
 * and appends a `// A | B | C` hint after every value whose *field type* is
 * an enum. Hints are resolved through the field's `resolvedTypeName`, so two
 * enums sharing a value name (e.g. `UNKNOWN`) each annotate with their own
 * value set, and plain uppercase strings in non-enum fields are left alone.
 *
 * The output is display-only — the `//` comments make it invalid JSON.
 */
export const annotateJsonWithEnums = (
  json: unknown,
  message: ProtobufMessageInfo,
  schema: ProtobufSchemaInfo,
): string => {
  const enumsByFullName = new Map(collectAllEnumsFlat(schema).map((e) => [e.fullName, e]))
  const messagesByFullName = new Map(collectAllMessagesFlat(schema.messages).map((m) => [m.fullName, m]))

  const resolver: ProtobufFieldTypeResolver = {
    enumValues: (field) => {
      if (field.resolvedKind !== 'enum' || !field.resolvedTypeName) return null
      const info = enumsByFullName.get(field.resolvedTypeName)
      return info ? Object.keys(info.values) : null
    },
    message: (field) => {
      if (field.resolvedKind !== 'message' || !field.resolvedTypeName) return null
      return messagesByFullName.get(field.resolvedTypeName) ?? null
    },
  }

  return renderValue(json, message, resolver).join('\n')
}
