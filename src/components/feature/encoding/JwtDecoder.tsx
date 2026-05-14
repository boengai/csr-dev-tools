import { useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
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
  const [source, setSource] = useState('')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const {
    result: decoded,
    setInput,
    setInputImmediate,
  } = useToolComputation<string, JwtDecoded>(
    (val) => {
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
    {
      debounceMs: 300,
      initial: EMPTY_DECODED,
      isEmpty: (val) => val.length === 0,
      onError: (err) => {
        const message = err instanceof Error ? err.message : DECODE_FAILURE_MESSAGE
        toast({ action: 'add', item: { label: message, type: 'error' } })
      },
    },
  )

  const handleSourceChange = (val: string) => {
    setSource(val)
    setInput(val)
  }

  const handleReset = () => {
    setSource('')
    setInputImmediate('')
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Decode
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title="JWT Decode"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JWT Token"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto">
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
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
