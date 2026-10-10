import type { JwtExpirationStatus } from '@/types'

export type JwtDecoded = {
  expiration: JwtExpirationStatus
  header: string
  payload: string
  payloadCopy: string
  signature: string
}
