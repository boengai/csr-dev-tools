import { useState } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { aesDecrypt, aesEncrypt } from '@/utils/aes'

const toolEntry = TOOL_REGISTRY_MAP['aes-encrypt-decrypt']

type Mode = 'decrypt' | 'encrypt'

export const AesEncryptDecrypt = () => {
  const [source, setSource] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<Mode>('encrypt')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const processEncrypt = async (text: string, pass: string) => {
    if (!text || !pass) {
      setResult('')
      setError('')
      return
    }
    setLoading(true)
    try {
      const encrypted = await aesEncrypt(text, pass)
      setResult(encrypted)
      setError('')
    } catch {
      setResult('')
      setError('Encryption failed')
    } finally {
      setLoading(false)
    }
  }

  const processDecrypt = async (text: string, pass: string) => {
    if (!text || !pass) {
      setResult('')
      setError('')
      return
    }
    setLoading(true)
    try {
      const decrypted = await aesDecrypt(text, pass)
      setResult(decrypted)
      setError('')
    } catch {
      setResult('')
      setError('Decryption failed — incorrect password or corrupted data')
    } finally {
      setLoading(false)
    }
  }

  const debouncedProcess = useDebounceCallback((text: string, pass: string, m: Mode) => {
    if (m === 'encrypt') {
      processEncrypt(text, pass)
    } else {
      processDecrypt(text, pass)
    }
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    debouncedProcess(val, password, mode)
  }

  const handlePasswordChange = (val: string) => {
    setPassword(val)
    debouncedProcess(source, val, mode)
  }

  const openDialog = (m: Mode) => {
    setMode(m)
    setSource('')
    setPassword('')
    setResult('')
    setError('')
    setDialogOpen(true)
  }

  const handleReset = () => {
    setSource('')
    setPassword('')
    setResult('')
    setError('')
  }

  const sourcePlaceholder = mode === 'encrypt' ? 'Enter plaintext to encrypt...' : 'Paste encrypted Base64 string...'
  const resultLabel = mode === 'encrypt' ? 'Encrypted Output' : 'Decrypted Output'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('encrypt')} variant="default">
            Encrypt
          </Button>
          <Button block onClick={() => openDialog('decrypt')} variant="default">
            Decrypt
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title={mode === 'encrypt' ? 'AES-256-GCM Encrypt' : 'AES-256-GCM Decrypt'}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <FieldForm
                label="Source"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={sourcePlaceholder}
                rows={10}
                type="textarea"
                value={source}
              />
              <FieldForm
                label="Password"
                name="dialog-password"
                onChange={handlePasswordChange}
                placeholder="Enter password..."
                type="text"
                value={password}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                disabled={!result}
                label={
                  <span className="flex items-center gap-1">
                    <span>{resultLabel}</span>
                    {result && <CopyButton label="result" value={result} />}
                  </span>
                }
                name="result"
                placeholder={loading ? 'Processing...' : '\u2014'}
                rows={12}
                type="textarea"
                value={result}
              />
              {error && <p className="text-body-xs text-red-400">{error}</p>}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
