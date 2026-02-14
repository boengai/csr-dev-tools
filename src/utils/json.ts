export const formatJson = (input: string, indent = 2): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  const parsed = JSON.parse(input)
  return JSON.stringify(parsed, null, indent)
}

export const getJsonParseError = (input: string): string | null => {
  if (input.trim().length === 0) return 'Empty input'
  try {
    JSON.parse(input)
    return null
  } catch (e) {
    return e instanceof SyntaxError ? e.message : 'Invalid JSON'
  }
}
