import { useCallback, useRef, useState } from 'react'

import { Button, CopyButton, FieldForm, TextAreaInput, ToggleButton } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useStaleSafeAsync, useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import {
  DEFAULT_HMAC_ALGORITHM,
  DEFAULT_HMAC_ENCODING,
  generateHmac,
  HMAC_ALGORITHMS,
  type HmacAlgorithm,
  type HmacEncoding,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['hmac-generator']

const ENCODINGS: Array<HmacEncoding> = ['hex', 'base64']

export const HmacGenerator = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [message, setMessage] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>(DEFAULT_HMAC_ALGORITHM)
  const [encoding, setEncoding] = useState<HmacEncoding>(DEFAULT_HMAC_ENCODING)
  const [hmac, setHmac] = useState('')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const newSession = useStaleSafeAsync()
  const algorithmRef = useRef(algorithm)
  algorithmRef.current = algorithm
  const encodingRef = useRef(encoding)
  encodingRef.current = encoding
  const messageRef = useRef(message)
  messageRef.current = message
  const secretKeyRef = useRef(secretKey)
  secretKeyRef.current = secretKey
  const { toast } = useToast()

  const handleCompute = useCallback(
    async (msg: string, key: string, algo: HmacAlgorithm, enc: HmacEncoding) => {
      if (!msg || !key) {
        setHmac('')
        return
      }
      const session = newSession()
      try {
        const result = await generateHmac(msg, key, algo, enc)
        if (session.isFresh() && messageRef.current === msg && secretKeyRef.current === key) {
          setHmac(result)
        }
      } catch {
        session.ifFresh(() => {
          toast({
            action: 'add',
            item: {
              label: 'HMAC computation failed — your browser may not support this feature',
              type: 'error',
            },
          })
        })
      }
    },
    [newSession, toast],
  )

  const debouncedCompute = useDebounceCallback((msg: string, key: string) => {
    handleCompute(msg, key, algorithmRef.current, encodingRef.current)
  }, 300)

  const handleMessageChange = (value: string) => {
    setMessage(value)
    if (!value || !secretKey) {
      newSession()
      setHmac('')
      return
    }
    debouncedCompute(value, secretKey)
  }

  const handleKeyChange = (value: string) => {
    setSecretKey(value)
    if (!value || !message) {
      newSession()
      setHmac('')
      return
    }
    debouncedCompute(message, value)
  }

  const handleAlgorithmChange = (algo: HmacAlgorithm) => {
    setAlgorithm(algo)
    handleCompute(message, secretKey, algo, encoding)
  }

  const handleEncodingChange = (enc: HmacEncoding) => {
    setEncoding(enc)
    handleCompute(message, secretKey, algorithm, enc)
  }

  const handleReset = () => {
    newSession()
    setMessage('')
    setSecretKey('')
    setHmac('')
    setAlgorithm(DEFAULT_HMAC_ALGORITHM)
    setEncoding(DEFAULT_HMAC_ENCODING)
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Generate HMAC
          </Button>
        </div>
      </div>

      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="default"
        title="HMAC Generator"
      >
        <div className="flex w-full grow flex-col gap-4">
          <TextAreaInput
            aria-label="Message to sign"
            name="hmac-message"
            onChange={handleMessageChange}
            placeholder="Enter message to sign..."
            value={message}
          />

          <FieldForm
            aria-label="Secret key"
            label=""
            name="hmac-secret-key"
            onChange={handleKeyChange}
            placeholder="Enter secret key..."
            type="text"
            value={secretKey}
          />

          <div className="flex shrink-0 flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {HMAC_ALGORITHMS.map((algo) => (
                <ToggleButton
                  aria-label={`Select ${algo} algorithm`}
                  key={algo}
                  onClick={() => handleAlgorithmChange(algo)}
                  pressed={algo === algorithm}
                >
                  {algo}
                </ToggleButton>
              ))}
            </div>

            <div className="h-5 w-px bg-gray-800" />

            <div className="flex flex-wrap gap-2">
              {ENCODINGS.map((enc) => (
                <ToggleButton
                  aria-label={`Select ${enc} encoding`}
                  key={enc}
                  onClick={() => handleEncodingChange(enc)}
                  pressed={enc === encoding}
                >
                  {enc}
                </ToggleButton>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-900" />

          <div aria-live="polite" className="flex min-h-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-medium text-gray-400">
                HMAC-{algorithm} ({encoding})
              </span>
              {hmac && <CopyButton label="HMAC value" value={hmac} />}
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <span className="text-sm font-mono break-all text-gray-300">{hmac || '—'}</span>
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
