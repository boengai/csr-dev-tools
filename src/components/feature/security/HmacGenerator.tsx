import { useState } from 'react'

import { CopyButton, FieldForm, TextAreaInput, ToggleButton } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { HmacInput, ToolComponentProps } from '@/types'
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
  const { toast } = useToast()

  const { result: hmac, setInput, setInputImmediate } = useToolComputation<HmacInput, string>(
    ({ message: msg, secretKey: key, algorithm: algo, encoding: enc }) => generateHmac(msg, key, algo, enc),
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ message: msg, secretKey: key }) => !msg || !key,
      onError: () => {
        toast({
          action: 'add',
          item: {
            label: 'HMAC computation failed — your browser may not support this feature',
            type: 'error',
          },
        })
      },
    },
  )

  const handleMessageChange = (value: string) => {
    setMessage(value)
    setInput({ message: value, secretKey, algorithm, encoding })
  }

  const handleKeyChange = (value: string) => {
    setSecretKey(value)
    setInput({ message, secretKey: value, algorithm, encoding })
  }

  const handleAlgorithmChange = (algo: HmacAlgorithm) => {
    setAlgorithm(algo)
    setInputImmediate({ message, secretKey, algorithm: algo, encoding })
  }

  const handleEncodingChange = (enc: HmacEncoding) => {
    setEncoding(enc)
    setInputImmediate({ message, secretKey, algorithm, encoding: enc })
  }

  const handleReset = () => {
    setMessage('')
    setSecretKey('')
    setAlgorithm(DEFAULT_HMAC_ALGORITHM)
    setEncoding(DEFAULT_HMAC_ENCODING)
    setInputImmediate({
      message: '',
      secretKey: '',
      algorithm: DEFAULT_HMAC_ALGORITHM,
      encoding: DEFAULT_HMAC_ENCODING,
    })
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      size="default"
      title="HMAC Generator"
      triggers={[{ label: 'Generate HMAC' }]}
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
    </ToolDialogFrame>
  )
}
