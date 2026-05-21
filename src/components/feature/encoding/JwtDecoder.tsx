import { CodeOutput, CopyButton, FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { decodeJwt, formatPayloadWithTimestamps, isValidJwt } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['jwt-decoder']

type JwtDecoded = {
  header: string
  payload: string
  payloadCopy: string
  signature: string
}

const EMPTY_DECODED: JwtDecoded = { header: '', payload: '', payloadCopy: '', signature: '' }

const INVALID_JWT_MESSAGE = 'Enter a valid JWT token (e.g., eyJhbGciOiJIUzI1NiJ9...)'
const DECODE_FAILURE_MESSAGE = 'JWT contains invalid header or payload — could not decode segments'

export const JwtDecoder = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { showError } = useToast()

  const { input: source, result: decoded, setInput, reset } = useToolInput<string, JwtDecoded>({
    compute: (val) => {
      if (!isValidJwt(val)) throw new Error(INVALID_JWT_MESSAGE)
      try {
        const { header, payload, signature } = decodeJwt(val)
        return {
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
    initial: '',
    initialResult: EMPTY_DECODED,
    isEmpty: (val) => val.length === 0,
    onError: (err) => {
      const message = err instanceof Error ? err.message : DECODE_FAILURE_MESSAGE
      showError(message)
    },
  })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="JWT Decode"
      triggers={[{ label: 'Decode' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="JWT Token"
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
