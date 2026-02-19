import { parse, stringify } from 'yaml'

export const formatYaml = (input: string, options?: { indent?: number; sortKeys?: boolean }): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const parsed = parse(input)
  return stringify(parsed, {
    indent: options?.indent ?? 2,
    sortMapEntries: options?.sortKeys ?? false,
  })
}

export const getYamlParseError = (input: string): string | null => {
  if (input.trim().length === 0) return 'Empty input'
  try {
    parse(input)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid YAML'
  }
}

export const jsonToYaml = (input: string): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  return stringify(JSON.parse(input), { indent: 2 })
}

export const yamlToJson = (input: string, indent = 2): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const parsed = parse(input)
  return JSON.stringify(parsed, null, indent)
}
