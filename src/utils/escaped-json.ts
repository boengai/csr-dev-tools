export const stringifyJson = (input: string, doubleEscape = false): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  JSON.parse(input)
  let result = JSON.stringify(input)
  result = result.slice(1, -1)
  if (doubleEscape) {
    result = JSON.stringify(result)
    result = result.slice(1, -1)
  }
  return result
}

export const parseStringifiedJson = (input: string): string => {
  if (input.trim().length === 0) throw new Error('Empty input')
  let unescaped: string
  try {
    unescaped = JSON.parse(`"${input}"`)
  } catch {
    try {
      unescaped = JSON.parse(`"${JSON.parse(`"${input}"`)}"`)
    } catch {
      throw new Error('Invalid escaped JSON string')
    }
  }
  JSON.parse(unescaped)
  return JSON.stringify(JSON.parse(unescaped), null, 2)
}
