export const tomlToJson = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { parse } = await import('smol-toml')
  const parsed = parse(input)
  return JSON.stringify(parsed, null, 2)
}

export const jsonToToml = async (input: string): Promise<string> => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const { stringify } = await import('smol-toml')
  const obj = JSON.parse(input)
  return stringify(obj)
}

export const getTomlParseError = async (input: string): Promise<string | null> => {
  if (input.trim().length === 0) return 'Empty input'
  try {
    const { parse } = await import('smol-toml')
    parse(input)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid TOML'
  }
}
