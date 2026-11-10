import { FieldForm, ToggleButton, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { HmacInput, ToolComponentProps } from '@/types'
import {
  DEFAULT_HMAC_ALGORITHM,
  DEFAULT_HMAC_ENCODING,
  generateHmac,
  HMAC_ALGORITHMS,
  type HmacEncoding,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['hmac-generator']

const ENCODINGS: Array<HmacEncoding> = ['hex', 'base64']

const INITIAL: HmacInput = {
  algorithm: DEFAULT_HMAC_ALGORITHM,
  encoding: DEFAULT_HMAC_ENCODING,
  secretKey: '',
  source: '',
}

// The secret key is a second required input: blank means "not ready yet",
// so it yields empty output (the placeholder), not an error.
export const HmacGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<HmacInput>
    autoOpen={autoOpen}
    clearOnReset={{ secretKey: '' }}
    compute={({ algorithm, encoding, secretKey, source }) =>
      secretKey ? generateHmac(source, secretKey, algorithm, encoding) : ''
    }
    description={toolEntry?.description}
    errorLabel="HMAC computation failed — your browser may not support this feature"
    initial={INITIAL}
    onAfterClose={onAfterClose}
    // The secret key must never reach localStorage, so nothing in this bag is saved.
    persistInput={false}
    renderControls={({ inputs, setFields, setFieldsImmediate }) => (
      <>
        <div className="sm:w-64 w-full">
          <FieldForm
            label="Secret key"
            name="hmac-secret-key"
            onChange={(val: string) => setFields({ secretKey: val })}
            placeholder="Enter secret key..."
            type="text"
            value={inputs.secretKey}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {HMAC_ALGORITHMS.map((algo) => (
            <ToggleButton
              aria-label={`Select ${algo} algorithm`}
              key={algo}
              onClick={() => setFieldsImmediate({ algorithm: algo })}
              pressed={algo === inputs.algorithm}
            >
              {algo}
            </ToggleButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {ENCODINGS.map((enc) => (
            <ToggleButton
              aria-label={`Select ${enc} encoding`}
              key={enc}
              onClick={() => setFieldsImmediate({ encoding: enc })}
              pressed={enc === inputs.encoding}
            >
              {enc}
            </ToggleButton>
          ))}
        </div>
      </>
    )}
    resultLabel={({ algorithm, encoding }) => `HMAC-${algorithm} (${encoding})`}
    resultPlaceholder="Enter a message and a secret key to sign it"
    sourceKind="textarea"
    sourceLabel="Message to sign"
    sourcePlaceholder="Enter message to sign..."
    title="HMAC Generator"
    triggerLabel="Generate HMAC"
  />
)
