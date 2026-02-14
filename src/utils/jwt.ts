type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return atob(base64)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const decodeJwt = (token: string): DecodedJwt => {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format — expected 3 dot-separated segments')
  }

  let header: Record<string, unknown>
  try {
    const parsedHeader: unknown = JSON.parse(base64UrlDecode(parts[0]))
    if (!isPlainObject(parsedHeader)) throw new Error('not an object')
    header = parsedHeader
  } catch {
    throw new Error('Invalid JWT header — could not decode or parse')
  }

  let payload: Record<string, unknown>
  try {
    const parsedPayload: unknown = JSON.parse(base64UrlDecode(parts[1]))
    if (!isPlainObject(parsedPayload)) throw new Error('not an object')
    payload = parsedPayload
  } catch {
    throw new Error('Invalid JWT payload — could not decode or parse')
  }

  return { header, payload, signature: parts[2] }
}

export const formatTimestampClaim = (value: number): string => {
  return new Date(value * 1000).toLocaleString()
}

const TIMESTAMP_CLAIMS = new Set(['exp', 'iat', 'nbf'])

export const formatPayloadWithTimestamps = (payload: Record<string, unknown>): string => {
  const json = JSON.stringify(payload, null, 2)

  const timestampEntries = new Map<string, number>()
  for (const claim of TIMESTAMP_CLAIMS) {
    const value = payload[claim]
    if (typeof value === 'number') {
      timestampEntries.set(claim, value)
    }
  }

  if (timestampEntries.size === 0) return json

  return json
    .split('\n')
    .map((line) => {
      for (const [claim, value] of timestampEntries) {
        if (line.startsWith(`  "${claim}"`)) {
          return `${line}  // ${formatTimestampClaim(value)}`
        }
      }
      return line
    })
    .join('\n')
}
