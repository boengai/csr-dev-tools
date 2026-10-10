import type { DecodedJwt, JwtExpirationStatus } from '@/types/utils/jwt'

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  // atob yields one char per byte; JWT segments are UTF-8 JSON, so decode the
  // bytes rather than handing the binary string to JSON.parse. `fatal` turns
  // malformed UTF-8 into a thrown error (surfaced as "could not decode").
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const decodeJwt = (token: string): DecodedJwt => {
  const [encodedHeader, encodedPayload, signature, ...extra] = token.split('.')
  if (encodedHeader === undefined || encodedPayload === undefined || signature === undefined || extra.length > 0) {
    throw new Error('Invalid JWT format — expected 3 dot-separated segments')
  }

  let header: Record<string, unknown>
  try {
    const parsedHeader: unknown = JSON.parse(base64UrlDecode(encodedHeader))
    if (!isPlainObject(parsedHeader)) throw new Error('not an object')
    header = parsedHeader
  } catch {
    throw new Error('Invalid JWT header — could not decode or parse')
  }

  let payload: Record<string, unknown>
  try {
    const parsedPayload: unknown = JSON.parse(base64UrlDecode(encodedPayload))
    if (!isPlainObject(parsedPayload)) throw new Error('not an object')
    payload = parsedPayload
  } catch {
    throw new Error('Invalid JWT payload — could not decode or parse')
  }

  return { header, payload, signature }
}

export const formatTimestampClaim = (value: number): string => {
  return new Date(value * 1000).toLocaleString()
}

// Inspect a decoded payload for `exp` (Unix seconds, per RFC 7519). Returns a
// tagged status the UI can render as a coloured badge. `nowMs` defaults to
// Date.now() but is injectable for deterministic tests.
export const getExpirationStatus = (
  payload: Record<string, unknown>,
  nowMs: number = Date.now(),
): JwtExpirationStatus => {
  const exp = payload.exp
  if (typeof exp !== 'number') return { kind: 'no-exp' }
  const expMs = exp * 1000
  const deltaSeconds = Math.round((expMs - nowMs) / 1000)
  const human = formatTimestampClaim(exp)
  if (deltaSeconds <= 0) {
    return { kind: 'expired', expiredAt: human, secondsAgo: -deltaSeconds }
  }
  return { kind: 'valid', expiresAt: human, secondsUntil: deltaSeconds }
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
