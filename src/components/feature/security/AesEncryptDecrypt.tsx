import { CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolFields } from '@/hooks'
import type { AesInput, ToolComponentProps } from '@/types'
import { aesDecrypt, aesEncrypt } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['aes-encrypt-decrypt']

const INITIAL_INPUT: AesInput = { mode: 'encrypt', password: '', source: '' }

export const AesEncryptDecrypt = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const {
    error,
    inputs,
    isPending: loading,
    reset,
    result,
    setFields,
    setFieldsImmediate,
  } = useToolFields<AesInput, string>({
    compute: ({ mode: m, password: pass, source: text }) =>
      m === 'encrypt' ? aesEncrypt(text, pass) : aesDecrypt(text, pass),
    debounceMs: 300,
    initial: INITIAL_INPUT,
    initialResult: '',
    isEmpty: ({ password: pass, source: text }) => !text || !pass,
  })

  const { mode, password, source } = inputs

  const displayError = error
    ? mode === 'encrypt'
      ? 'Encryption failed'
      : 'Decryption failed — incorrect password or corrupted data'
    : ''

  const sourcePlaceholder = mode === 'encrypt' ? 'Enter plaintext to encrypt...' : 'Paste encrypted Base64 string...'
  const resultLabel = mode === 'encrypt' ? 'Encrypted Output' : 'Decrypted Output'

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title={mode === 'encrypt' ? 'AES-256-GCM Encrypt' : 'AES-256-GCM Decrypt'}
      triggers={[
        { label: 'Encrypt', onOpen: () => setFieldsImmediate({ mode: 'encrypt', password: '', source: '' }) },
        { label: 'Decrypt', onOpen: () => setFieldsImmediate({ mode: 'decrypt', password: '', source: '' }) },
      ]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
            <FieldForm
              label="Source"
              name="dialog-source"
              onChange={(val) => setFields({ source: val })}
              placeholder={sourcePlaceholder}
              rows={10}
              type="textarea"
              value={source}
            />
            <FieldForm
              label="Password"
              name="dialog-password"
              onChange={(val) => setFields({ password: val })}
              placeholder="Enter password..."
              type="text"
              value={password}
            />
          </div>

          <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <CodeOutput
              label={
                <span className="flex items-center gap-1">
                  <span>{resultLabel}</span>
                  {result && !error && <CopyButton label="result" value={result} />}
                </span>
              }
              placeholder={loading ? 'Processing...' : '—'}
              value={error ? '' : result}
            />
            {displayError && <p className="text-red-400 text-body-xs">{displayError}</p>}
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
