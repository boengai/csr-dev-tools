import { useCallback, useRef, useState } from 'react'

import { CopyButton, FieldForm, TextAreaInput } from '@/components/common'
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

export const HmacGenerator = (_props: ToolComponentProps) => {
  const [message, setMessage] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>(DEFAULT_HMAC_ALGORITHM)
  const [encoding, setEncoding] = useState<HmacEncoding>(DEFAULT_HMAC_ENCODING)
  const [hmac, setHmac] = useState('')
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

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

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
            <button
              aria-label={`Select ${algo} algorithm`}
              aria-pressed={algo === algorithm}
              className="text-xs rounded border px-3 font-mono leading-7 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
              data-state={algo === algorithm ? 'active' : 'inactive'}
              key={algo}
              onClick={() => handleAlgorithmChange(algo)}
              type="button"
            >
              {algo}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-800" />

        <div className="flex flex-wrap gap-2">
          {ENCODINGS.map((enc) => (
            <button
              aria-label={`Select ${enc} encoding`}
              aria-pressed={enc === encoding}
              className="text-xs rounded border px-3 font-mono leading-7 data-[state=active]:border-primary data-[state=active]:bg-primary/20 data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:border-gray-700 data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500"
              data-state={enc === encoding ? 'active' : 'inactive'}
              key={enc}
              onClick={() => handleEncodingChange(enc)}
              type="button"
            >
              {enc}
            </button>
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
          <span className="text-sm font-mono break-all text-gray-300">{hmac || '\u2014'}</span>
        </div>
      </div>
    </div>
  )
}
