import { GeneratorShell, ToggleButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { GeneratorFile, RsaKeyGeneratorOptions, RsaKeySize, ToolComponentProps } from '@/types'
import { generateRsaKeyPair } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['rsa-key-generator']

const KEY_SIZES: Array<{ label: string; value: RsaKeySize }> = [
  { label: '2048 bits', value: 2048 },
  { label: '4096 bits', value: 4096 },
]

const PEM_MIME = 'application/x-pem-file'

const generate = async ({ keySize }: RsaKeyGeneratorOptions): Promise<Array<GeneratorFile>> => {
  if (!KEY_SIZES.some((s) => s.value === keySize)) throw new Error('Key size must be 2048 or 4096 bits')
  if (!crypto.subtle) throw new Error('RSA key generation requires a secure context (HTTPS)')
  const pair = await generateRsaKeyPair(keySize).catch(() => {
    throw new Error('Key generation failed. Please try again.')
  })
  return [
    { filename: 'public.pem', label: 'Public key (SPKI)', mimeType: PEM_MIME, value: pair.publicKey },
    { filename: 'private.pem', label: 'Private key (PKCS#8)', mimeType: PEM_MIME, value: pair.privateKey },
  ]
}

export const RsaKeyGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <GeneratorShell
    autoOpen={autoOpen}
    compute={generate}
    description={toolEntry?.description}
    initial={{ keySize: 2048 }}
    onAfterClose={onAfterClose}
    output={{ kind: 'files', placeholder: 'Press Generate to create a key pair' }}
    renderOptions={({ options, setOptions }) => (
      <>
        <div className="border-teal-800 bg-teal-950/50 flex items-center gap-3 rounded border px-4 py-3" role="note">
          <span aria-hidden="true" className="text-lg">
            🔒
          </span>
          <p className="text-teal-300 text-body-xs">
            Keys are generated entirely in your browser. No data is sent to any server.
          </p>
        </div>
        <fieldset className="flex flex-col gap-2">
          <span className="text-body-xs font-medium text-gray-400">Key size</span>
          <div aria-label="RSA key size" className="flex gap-2" role="group">
            {KEY_SIZES.map((option) => (
              <ToggleButton
                key={option.value}
                onClick={() => setOptions({ keySize: option.value })}
                pressed={options.keySize === option.value}
              >
                {option.label}
              </ToggleButton>
            ))}
          </div>
          <p className="text-body-xs text-gray-500">2048: ~50–150 ms · 4096: ~0.4–1 s</p>
        </fieldset>
      </>
    )}
    run={{ generateLabel: 'Generate key pair', mode: 'random', slow: true }}
    storageKey="csr-dev-tools-rsa-key-generator"
    title="RSA Key Generator"
    triggerLabel="Generate RSA Key Pair"
  />
)
