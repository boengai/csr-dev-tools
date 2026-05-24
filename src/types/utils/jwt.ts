export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

export type JwtExpirationStatus =
  | { kind: 'expired'; expiredAt: string; secondsAgo: number }
  | { kind: 'no-exp' }
  | { kind: 'valid'; expiresAt: string; secondsUntil: number }
