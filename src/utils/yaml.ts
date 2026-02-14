export const jsonToYaml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { stringify } = await import('yaml')
  return stringify(JSON.parse(input), { indent: 2 })
}

export const yamlToJson = async (input: string, indent = 2): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { parse } = await import('yaml')
  const parsed = parse(input)
  return JSON.stringify(parsed, null, indent)
}

export const getYamlParseError = async (input: string): Promise<string | null> => {
  if (input.trim().length === 0) return 'Empty input'
  try {
    const { parse } = await import('yaml')
    parse(input)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid YAML'
  }
}
