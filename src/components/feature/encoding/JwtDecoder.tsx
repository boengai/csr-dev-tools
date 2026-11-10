import { Button, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { JwtExpirationStatus, ToolComponentProps, TransformerField } from '@/types'
import { decodeJwt, formatPayloadWithTimestamps, getExpirationStatus, isValidJwt } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['jwt-decoder']

const INITIAL: { source: string } = { source: '' }

const INVALID_JWT_MESSAGE = 'Enter a valid JWT token (e.g., eyJhbGciOiJIUzI1NiJ9...)'
const DECODE_FAILURE_MESSAGE = 'JWT contains invalid header or payload — could not decode segments'

const EXPIRY_LABEL = 'Expiry'

// A non-expiring sample (`exp` set in year 2286) so "Load sample" reliably
// demonstrates the decode pipeline.
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.dummy-sig'

const formatRelativeSeconds = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

// Only the expired wording starts with "Expired"; `notices` relies on that.
const expiryField = (status: JwtExpirationStatus): Array<TransformerField> => {
  if (status.kind === 'no-exp') return []
  const value =
    status.kind === 'expired'
      ? `Expired ${formatRelativeSeconds(status.secondsAgo)} ago (exp: ${status.expiredAt})`
      : `Valid — expires in ${formatRelativeSeconds(status.secondsUntil)} (${status.expiresAt})`
  return [{ copy: false, label: EXPIRY_LABEL, value }]
}

const decodeSegments = (token: string) => {
  try {
    return decodeJwt(token)
  } catch {
    throw new Error(DECODE_FAILURE_MESSAGE)
  }
}

const decode = (token: string): Array<TransformerField> => {
  if (!isValidJwt(token)) throw new Error(INVALID_JWT_MESSAGE)
  const { header, payload, signature } = decodeSegments(token)
  return [
    ...expiryField(getExpirationStatus(payload)),
    { label: 'Header', value: JSON.stringify(header, null, 2) },
    // Shown with human-readable timestamps; Copy takes the raw JSON.
    { copyValue: JSON.stringify(payload, null, 2), label: 'Payload', value: formatPayloadWithTimestamps(payload) },
    { label: 'Signature (not verified — client-side only)', value: signature },
  ]
}

export const JwtDecoder = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={({ source }) => decode(source.trim())}
    description={toolEntry?.description}
    errorFallback={DECODE_FAILURE_MESSAGE}
    initial={INITIAL}
    notices={(fields) => {
      const expiry = fields.find((f) => f.label === EXPIRY_LABEL)?.value
      return expiry?.startsWith('Expired') ? [expiry] : []
    }}
    onAfterClose={onAfterClose}
    outputKind="fields"
    // Tokens are not newly persisted: nothing pasted here reaches localStorage.
    persistInput={false}
    renderControls={({ setFieldsImmediate }) => (
      <Button onClick={() => setFieldsImmediate({ source: SAMPLE_JWT })} size="small">
        Load sample
      </Button>
    )}
    resultLabel="Decoded"
    resultPlaceholder="Paste a JWT to decode it"
    sourceLabel="JWT Token"
    sourcePlaceholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    title="JWT Decoder"
    triggerLabel="Decode"
  />
)
