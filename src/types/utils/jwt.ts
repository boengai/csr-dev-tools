export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}
