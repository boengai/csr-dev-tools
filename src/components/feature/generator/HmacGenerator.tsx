import { useCallback, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { HmacAlgorithm, HmacEncoding } from '@/utils'

import { CopyButton, TextAreaInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { DEFAULT_HMAC_ALGORITHM, DEFAULT_HMAC_ENCODING, generateHmac, HMAC_ALGORITHMS } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['hmac-generator']

const ENCODINGS: Array<HmacEncoding> = ['hex', 'base64']

export const HmacGenerator = (_props: ToolComponentProps) => {
  const [message, setMessage] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>(DEFAULT_HMAC_ALGORITHM)
  const [encoding, setEncoding] = useState<HmacEncoding>(DEFAULT_HMAC_ENCODING)
  const [hmac, setHmac] = useState('')
  const sessionRef = useRef(0)
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
      const session = ++sessionRef.current
      try {
        const result = await generateHmac(msg, key, algo, enc)
        if (session === sessionRef.current && messageRef.current === msg && secretKeyRef.current === key) {
          setHmac(result)
        }
      } catch {
        if (session === sessionRef.current) {
          toast({
            action: 'add',
            item: {
              label: 'HMAC computation failed — your browser may not support this feature',
              type: 'error',
            },
          })
        }
      }
    },
    [toast],
  )

  const debouncedCompute = useDebounceCallback((msg: string, key: string) => {
    handleCompute(msg, key, algorithmRef.current, encodingRef.current)
  }, 300)

  const handleMessageChange = (value: string) => {
    setMessage(value)
    if (!value || !secretKey) {
      ++sessionRef.current
      setHmac('')
      return
    }
    debouncedCompute(value, secretKey)
  }

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSecretKey(value)
    if (!value || !message) {
      ++sessionRef.current
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
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <TextAreaInput
        name="hmac-message"
        onChange={handleMessageChange}
        placeholder="Enter message to sign..."
        value={message}
      />

      <input
        className="text-sm w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 font-mono text-gray-300 outline-none placeholder:text-gray-600 focus:border-primary"
        name="hmac-secret-key"
        onChange={handleKeyChange}
        placeholder="Enter secret key..."
        type="password"
        value={secretKey}
      />

      <div className="flex shrink-0 flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {HMAC_ALGORITHMS.map((algo) => (
            <button
              aria-label={`Select ${algo} algorithm`}
              aria-pressed={algo === algorithm}
              className={`text-xs rounded border px-3 font-mono leading-7 ${
                algo === algorithm
                  ? 'border-primary bg-primary/20 font-bold text-primary'
                  : 'border-gray-700 bg-transparent text-gray-500'
              }`}
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
              className={`text-xs rounded border px-3 font-mono leading-7 ${
                enc === encoding
                  ? 'border-primary bg-primary/20 font-bold text-primary'
                  : 'border-gray-700 bg-transparent text-gray-500'
              }`}
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
