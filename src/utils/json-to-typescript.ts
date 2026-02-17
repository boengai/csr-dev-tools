export type JsonToTsOptions = {
  optionalProperties: boolean
  rootName: string
  useInterface: boolean
}

const DEFAULT_OPTIONS: JsonToTsOptions = {
  optionalProperties: false,
  rootName: 'Root',
  useInterface: true,
}

const toPascalCase = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())
}

type CollectedType = {
  body: string
  name: string
}

const inferType = (value: unknown, key: string, collected: Array<CollectedType>): string => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return inferArrayType(value, key, collected)
  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      if (typeof value === 'object') {
        const typeName = toPascalCase(key)
        buildObjectType(value as Record<string, unknown>, typeName, collected)
        return typeName
      }
      return 'unknown'
  }
}

const inferArrayType = (arr: Array<unknown>, key: string, collected: Array<CollectedType>): string => {
  if (arr.length === 0) return 'Array<unknown>'

  const singularKey = key.replace(/s$/, '') || key
  const types = new Set<string>()

  for (const item of arr) {
    types.add(inferType(item, singularKey, collected))
  }

  const uniqueTypes = [...types]
  const inner = uniqueTypes.length === 1 ? uniqueTypes[0] : uniqueTypes.join(' | ')
  return `Array<${inner}>`
}

const buildObjectType = (obj: Record<string, unknown>, name: string, collected: Array<CollectedType>): void => {
  const keys = Object.keys(obj)
  if (keys.length === 0) {
    collected.push({ body: 'Record<string, unknown>', name })
    return
  }

  const lines: Array<string> = []
  for (const k of keys) {
    const tsType = inferType(obj[k], k, collected)
    lines.push(`  ${k}: ${tsType}`)
  }

  collected.push({ body: lines.join('\n'), name })
}

export const jsonToTypeScript = (json: string, opts?: Partial<JsonToTsOptions>): string => {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  const parsed: unknown = JSON.parse(json)

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    const t = inferType(parsed, options.rootName, [])
    return options.useInterface
      ? `interface ${options.rootName} {\n  value: ${t}\n}`
      : `type ${options.rootName} = {\n  value: ${t}\n}`
  }

  const collected: Array<CollectedType> = []
  buildObjectType(parsed as Record<string, unknown>, options.rootName, collected)

  const sep = options.optionalProperties ? '?: ' : ': '

  const output = collected
    .reverse()
    .map(({ body, name }) => {
      if (body === 'Record<string, unknown>') {
        return options.useInterface
          ? `interface ${name} extends Record<string, unknown> {}`
          : `type ${name} = Record<string, unknown>`
      }
      const formatted = body.replace(/: /g, sep)
      return options.useInterface ? `interface ${name} {\n${formatted}\n}` : `type ${name} = {\n${formatted}\n}`
    })
    .join('\n\n')

  return output
}
