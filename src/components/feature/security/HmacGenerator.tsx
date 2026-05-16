import { FieldForm, MonoOutputCell, TextAreaInput, ToggleButton } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFields } from '@/hooks'
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
  const { toast } = useToast()

  const { inputs, result: hmac, reset, setFields, setFieldsImmediate } = useToolFields<HmacInput, string>({
    compute: ({ message: msg, secretKey: key, algorithm: algo, encoding: enc }) => generateHmac(msg, key, algo, enc),
    debounceMs: 300,
    initial: { message: '', secretKey: '', algorithm: DEFAULT_HMAC_ALGORITHM, encoding: DEFAULT_HMAC_ENCODING },
    initialResult: '',
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
  })
  const { message, secretKey, algorithm, encoding } = inputs

  const handleMessageChange = (value: string) => setFields({ message: value })
  const handleKeyChange = (value: string) => setFields({ secretKey: value })
  const handleAlgorithmChange = (algo: HmacAlgorithm) => setFieldsImmediate({ algorithm: algo })
  const handleEncodingChange = (enc: HmacEncoding) => setFieldsImmediate({ encoding: enc })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
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

        <MonoOutputCell copyAriaLabel="HMAC value" label={`HMAC-${algorithm} (${encoding})`} value={hmac} />
      </div>
    </ToolDialogFrame>
  )
}
