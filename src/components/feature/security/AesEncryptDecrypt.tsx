import { useRef, useState } from 'react'

import { CodecShell, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import type { AesMode, CodecMode, ToolComponentProps } from '@/types'
import { aesDecrypt, aesEncrypt } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['aes-encrypt-decrypt']

const MODES: [CodecMode<AesMode>, CodecMode<AesMode>] = [
  {
    key: 'encrypt',
    label: 'Encrypt',
    resultLabel: 'Encrypted Output',
    resultPlaceholder: 'Enter text and a password to encrypt it',
    sourceLabel: 'Plaintext',
    sourcePlaceholder: 'Enter plaintext to encrypt...',
  },
  {
    key: 'decrypt',
    label: 'Decrypt',
    resultLabel: 'Decrypted Output',
    resultPlaceholder: 'Paste the encrypted Base64 and its password to decrypt it',
    sourceLabel: 'Encrypted Base64',
    sourcePlaceholder: 'Paste encrypted Base64 string...',
  },
]

const ERROR_BY_MODE: Record<AesMode, string> = {
  decrypt: 'Decryption failed — incorrect password or corrupted data',
  encrypt: 'Encryption failed',
}

export const AesEncryptDecrypt = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Key derivation is deliberately slow (PBKDF2), so password keystrokes are
  // debounced like source keystrokes instead of recomputing on every key.
  const recomputeRef = useRef<() => void>(() => undefined)
  const recomputeSoon = useDebounceCallback(() => recomputeRef.current(), 300)

  const compute = async ({ mode, source }: { mode: AesMode; source: string }) => {
    // A half-filled form is not an error: wait for the password.
    if (!password) return { output: '' }
    try {
      return { output: mode === 'encrypt' ? await aesEncrypt(source, password) : await aesDecrypt(source, password) }
    } catch {
      throw new Error(ERROR_BY_MODE[mode])
    }
  }

  return (
    <CodecShell<AesMode>
      autoOpen={autoOpen}
      compute={compute}
      description={toolEntry?.description}
      initialResult={{ output: '' }}
      modeStorageKey="aes-encrypt-decrypt"
      modes={MODES}
      onAfterClose={onAfterClose}
      onClearInput={() => setPassword('')}
      // Plaintext and ciphertext are sensitive: never write them to localStorage.
      persistSource={false}
      sourceKeyPrefix="aes"
      sourceToolbarSlot={({ recompute }) => {
        recomputeRef.current = recompute
        return (
          <div className="w-full tablet:max-w-sm">
            <FieldForm
              label="Password"
              name="dialog-password"
              onChange={(val: string) => {
                setPassword(val)
                recomputeSoon()
              }}
              placeholder="Enter password..."
              suffix={
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="cursor-pointer text-body-xs text-gray-400 transition-colors hover:text-primary"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              }
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
          </div>
        )
      }}
    />
  )
}
