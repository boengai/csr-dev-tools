import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { decodeJwt, formatPayloadWithTimestamps } from '@/utils/jwt'
import { isValidJwt } from '@/utils/validation'

const toolEntry = TOOL_REGISTRY_MAP['jwt-decoder']

export const JwtDecoder = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [headerResult, setHeaderResult] = useState('')
  const [payloadResult, setPayloadResult] = useState('')
  const [payloadCopyValue, setPayloadCopyValue] = useState('')
  const [signatureResult, setSignatureResult] = useState('')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()

  const process = (val: string) => {
    if (val.length === 0) {
      setHeaderResult('')
      setPayloadResult('')
      setPayloadCopyValue('')
      setSignatureResult('')
      return
    }

    if (!isValidJwt(val)) {
      setHeaderResult('')
      setPayloadResult('')
      setPayloadCopyValue('')
      setSignatureResult('')
      toast({
        action: 'add',
        item: { label: 'Enter a valid JWT token (e.g., eyJhbGciOiJIUzI1NiJ9...)', type: 'error' },
      })
      return
    }

    try {
      const { header, payload, signature } = decodeJwt(val)
      setHeaderResult(JSON.stringify(header, null, 2))
      setPayloadCopyValue(JSON.stringify(payload, null, 2))
      setPayloadResult(formatPayloadWithTimestamps(payload))
      setSignatureResult(signature)
    } catch {
      setHeaderResult('')
      setPayloadResult('')
      setPayloadCopyValue('')
      setSignatureResult('')
      toast({
        action: 'add',
        item: { label: 'JWT contains invalid header or payload — could not decode segments', type: 'error' },
      })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val)
  }, 300)

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
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Decode
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title="JWT Decode"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
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

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>Header</span>
                    <CopyButton label="header" value={headerResult} />
                  </span>
                }
                placeholder='{"alg": "HS256", "typ": "JWT"}'
                value={headerResult}
              />

              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>Payload</span>
                    <CopyButton label="payload" value={payloadCopyValue} />
                  </span>
                }
                placeholder='{"sub": "1234567890", "name": "John Doe"}'
                value={payloadResult}
              />

              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>Signature (not verified — client-side only)</span>
                    <CopyButton label="signature" value={signatureResult} />
                  </span>
                }
                placeholder="Base64URL signature string"
                value={signatureResult}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
