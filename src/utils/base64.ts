export const encodeBase64 = (input: string): string => {
  const bytes = new TextEncoder().encode(input)
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('')
  return btoa(binary)
}

export const decodeBase64 = (input: string): string => {
  let binary: string
  try {
    binary = atob(input)
  } catch {
    throw new Error('Invalid Base64 input')
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}
