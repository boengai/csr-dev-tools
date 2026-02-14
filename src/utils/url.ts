export const encodeUrl = (input: string): string => {
  if (input.length === 0) return ''
  return encodeURIComponent(input)
}

export const decodeUrl = (input: string): string => {
  if (input.length === 0) return ''
  return decodeURIComponent(input)
}
