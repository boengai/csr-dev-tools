import { CodeOutput, CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { JwtExpirationStatus, ToolComponentProps } from '@/types'
import { decodeJwt, formatPayloadWithTimestamps, getExpirationStatus, isValidJwt } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['jwt-decoder']

type JwtDecoded = {
  expiration: JwtExpirationStatus
  header: string
  payload: string
  payloadCopy: string
  signature: string
}

const EMPTY_DECODED: JwtDecoded = {
  expiration: { kind: 'no-exp' },
  header: '',
  payload: '',
  payloadCopy: '',
  signature: '',
}

const INVALID_JWT_MESSAGE = 'Enter a valid JWT token (e.g., eyJhbGciOiJIUzI1NiJ9...)'
const DECODE_FAILURE_MESSAGE = 'JWT contains invalid header or payload — could not decode segments'

// A non-expiring sample (`exp` set in year 33658) so the "Load sample" button
// reliably demonstrates the decode pipeline + the "valid" badge.
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.dummy-sig'

const formatRelativeSeconds = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

const ExpirationBadge = ({ status }: { status: JwtExpirationStatus }) => {
  if (status.kind === 'no-exp') return null
  if (status.kind === 'expired') {
    return (
      <p className="rounded border border-error/50 bg-error/10 px-3 py-2 text-body-xs text-error" role="status">
        Expired {formatRelativeSeconds(status.secondsAgo)} ago (exp: {status.expiredAt})
      </p>
    )
  }
  return (
    <p className="rounded border border-success/50 bg-success/10 px-3 py-2 text-body-xs text-success" role="status">
      Valid — expires in {formatRelativeSeconds(status.secondsUntil)} ({status.expiresAt})
    </p>
  )
}

export const JwtDecoder = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { input: source, result: decoded, setInput, reset } = useToolInput<string, JwtDecoded>({
    compute: (val) => {
      if (!isValidJwt(val)) throw new Error(INVALID_JWT_MESSAGE)
      try {
        const { header, payload, signature } = decodeJwt(val)
        return {
          expiration: getExpirationStatus(payload),
          header: JSON.stringify(header, null, 2),
          payload: formatPayloadWithTimestamps(payload),
          payloadCopy: JSON.stringify(payload, null, 2),
          signature,
        }
      } catch {
        throw new Error(DECODE_FAILURE_MESSAGE)
      }
    },
    debounceMs: 300,
    errorFallback: DECODE_FAILURE_MESSAGE,
    initial: '',
    initialResult: EMPTY_DECODED,
    isEmpty: (val) => val.length === 0,
  })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="JWT Decoder"
      triggers={[{ label: 'Decode' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <ExpirationBadge status={decoded.expiration} />
        <SplitPanel>
          <Pane>
            <FieldForm
              label={
                <span className="flex items-center gap-2">
                  <span>JWT Token</span>
                  <button
                    className="cursor-pointer rounded border border-gray-700 px-2 py-0.5 text-body-xs text-gray-400 transition-colors hover:border-primary hover:text-primary"
                    onClick={() => setInput(SAMPLE_JWT)}
                    type="button"
                  >
                    Load sample
                  </button>
                </span>
              }
              name="dialog-source"
              onChange={setInput}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              type="code"
              value={source}
            />
          </Pane>

          <Pane live scroll>
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>Header</span>
                  <CopyButton label="header" value={decoded.header} />
                </span>
              }
              placeholder='{"alg": "HS256", "typ": "JWT"}'
              value={decoded.header}
            />

            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>Payload</span>
                  <CopyButton label="payload" value={decoded.payloadCopy} />
                </span>
              }
              placeholder='{"sub": "1234567890", "name": "John Doe"}'
              value={decoded.payload}
            />

            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>Signature (not verified — client-side only)</span>
                  <CopyButton label="signature" value={decoded.signature} />
                </span>
              }
              placeholder="Base64URL signature string"
              value={decoded.signature}
            />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
