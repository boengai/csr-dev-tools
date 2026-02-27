import { motion } from 'motion/react'
import { useCallback, useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { RsaKeyPair, RsaKeySize } from '@/utils/rsa-key-generator'

import { Button, CodeInput, CopyButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import { downloadPemFile, generateRsaKeyPair } from '@/utils/rsa-key-generator'

const toolEntry = TOOL_REGISTRY_MAP['rsa-key-generator']

const KEY_SIZES: Array<{ label: string; value: RsaKeySize }> = [
  { label: '2048 bits', value: 2048 },
  { label: '4096 bits', value: 4096 },
]

export const RsaKeyGenerator = (_props: ToolComponentProps) => {
  const [keySize, setKeySize] = useState<RsaKeySize>(2048)
  const [generating, setGenerating] = useState(false)
  const [keyPair, setKeyPair] = useState<RsaKeyPair | null>(null)
  const { toast } = useToast()

  const handleGenerate = useCallback(async () => {
    if (!crypto.subtle) {
      toast({
        action: 'add',
        item: { label: 'RSA key generation requires a secure context (HTTPS)', type: 'error' },
      })
      return
    }

    setGenerating(true)
    try {
      const result = await generateRsaKeyPair(keySize)
      setKeyPair(result)
    } catch {
      toast({
        action: 'add',
        item: { label: 'Key generation failed. Please try again.', type: 'error' },
      })
    } finally {
      setGenerating(false)
    }
  }, [keySize, toast])

  const handleDownloadPublic = useCallback(() => {
    if (keyPair) downloadPemFile(keyPair.publicKey, 'public.pem')
  }, [keyPair])

  const handleDownloadPrivate = useCallback(() => {
    if (keyPair) downloadPemFile(keyPair.privateKey, 'private.pem')
  }, [keyPair])

  const handleDownloadAll = useCallback(() => {
    if (keyPair) {
      downloadPemFile(keyPair.publicKey, 'public.pem')
      setTimeout(() => downloadPemFile(keyPair.privateKey, 'private.pem'), 100)
    }
  }, [keyPair])

  return (
    <div className="flex w-full grow flex-col gap-6">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      {/* Security Banner */}
      <div className="border-teal-800 bg-teal-950/50 flex items-center gap-3 rounded border px-4 py-3" role="note">
        <span aria-hidden="true" className="text-lg">
          🔒
        </span>
        <p className="text-teal-300 text-body-xs">
          Keys are generated entirely in your browser. No data is sent to any server.
        </p>
      </div>

      {/* Key Size Selector + Generate */}
      <div className="sm:flex-row sm:items-end flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-xs font-medium text-gray-400">Key Size</legend>
          <div className="flex gap-2" aria-label="RSA key size">
            {KEY_SIZES.map((option) => (
              <button
                key={option.value}
                aria-pressed={keySize === option.value}
                className={`rounded border px-4 py-2 text-body-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  keySize === option.value
                    ? 'border-primary bg-primary/20 text-white'
                    : 'border-gray-700 bg-transparent text-gray-400 hover:border-gray-500'
                }`}
                onClick={() => setKeySize(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-body-xs text-gray-500">2048: ~50-150ms | 4096: ~400-1000ms</p>
        </fieldset>

        <Button aria-label="Generate RSA key pair" disabled={generating} onClick={handleGenerate} variant="primary">
          {generating ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                aria-label="Generating RSA key pair"
                className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                role="status"
                transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
              />
              Generating...
            </span>
          ) : (
            'Generate Key Pair'
          )}
        </Button>
      </div>

      {/* Output Section */}
      {keyPair && (
        <div aria-live="polite" className="flex flex-col gap-6">
          {/* Public Key */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-body-xs font-medium text-gray-400">Public Key (SPKI/PEM)</span>
              <div className="flex gap-2">
                <CopyButton label="public key" value={keyPair.publicKey} />
                <Button aria-label="Download public key" onClick={handleDownloadPublic} size="small">
                  Download
                </Button>
              </div>
            </div>
            <CodeInput minHeight="150px" name="public-key-output" readOnly value={keyPair.publicKey} />
          </div>

          {/* Private Key */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-body-xs font-medium text-gray-400">Private Key (PKCS#8/PEM)</span>
              <div className="flex gap-2">
                <CopyButton label="private key" value={keyPair.privateKey} />
                <Button aria-label="Download private key" onClick={handleDownloadPrivate} size="small">
                  Download
                </Button>
              </div>
            </div>
            <CodeInput minHeight="360px" name="private-key-output" readOnly value={keyPair.privateKey} />
          </div>

          {/* Download All */}
          <Button aria-label="Download all keys" onClick={handleDownloadAll}>
            Download All Keys
          </Button>
        </div>
      )}
    </div>
  )
}
