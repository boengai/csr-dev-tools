import { useState } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { decodeJwt, formatPayloadWithTimestamps } from '@/utils/jwt'
import { isValidJwt } from '@/utils/validation'

const toolEntry = TOOL_REGISTRY_MAP['jwt-decoder']

export const JwtDecoder = () => {
  const [source, setSource] = useState('')
  const [headerResult, setHeaderResult] = useState('')
  const [payloadResult, setPayloadResult] = useState('')
  const [payloadCopyValue, setPayloadCopyValue] = useState('')
  const [signatureResult, setSignatureResult] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { clearError, error, setError } = useToolError()

  const process = (val: string) => {
    if (val.length === 0) {
      setHeaderResult('')
      setPayloadResult('')
      setPayloadCopyValue('')
      setSignatureResult('')
      clearError()
      return
    }

    if (!isValidJwt(val)) {
      setHeaderResult('')
      setPayloadResult('')
      setPayloadCopyValue('')
      setSignatureResult('')
      setError('Enter a valid JWT token (e.g., eyJhbGciOiJIUzI1NiJ9...)')
      return
    }

    try {
      const { header, payload, signature } = decodeJwt(val)
      setHeaderResult(JSON.stringify(header, null, 2))
      setPayloadCopyValue(JSON.stringify(payload, null, 2))
      setPayloadResult(formatPayloadWithTimestamps(payload))
      setSignatureResult(signature)
      clearError()
    } catch {
      setHeaderResult('')
      setPayloadResult('')
      setPayloadCopyValue('')
      setSignatureResult('')
      setError('JWT contains invalid header or payload — could not decode segments')
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val)
  }, 150)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleReset = () => {
    setSource('')
    setHeaderResult('')
    setPayloadResult('')
    setPayloadCopyValue('')
    setSignatureResult('')
    clearError()
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => setDialogOpen(true)} variant="default">
          Decode
        </Button>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title="JWT Decode"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="tablet:flex-row flex size-full grow flex-col gap-6">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="JWT Token"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="tablet:border-t-0 tablet:border-l-2 border-t-2 border-dashed border-gray-900" />

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              <FieldForm
                disabled={!headerResult}
                label={
                  <span className="flex items-center gap-1">
                    <span>Header</span>
                    <CopyButton label="header" value={headerResult} />
                  </span>
                }
                name="header-result"
                placeholder='{"alg": "HS256", "typ": "JWT"}'
                rows={4}
                type="textarea"
                value={headerResult}
              />

              <FieldForm
                disabled={!payloadResult}
                label={
                  <span className="flex items-center gap-1">
                    <span>Payload</span>
                    <CopyButton label="payload" value={payloadCopyValue} />
                  </span>
                }
                name="payload-result"
                placeholder='{"sub": "1234567890", "name": "John Doe"}'
                rows={6}
                type="textarea"
                value={payloadResult}
              />

              <FieldForm
                disabled={!signatureResult}
                label={
                  <span className="flex items-center gap-1">
                    <span>Signature (not verified — client-side only)</span>
                    <CopyButton label="signature" value={signatureResult} />
                  </span>
                }
                name="signature-result"
                placeholder="Base64URL signature string"
                rows={2}
                type="textarea"
                value={signatureResult}
              />
            </div>
          </div>

          {error != null && (
            <p className="text-error text-body-sm shrink-0" role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
