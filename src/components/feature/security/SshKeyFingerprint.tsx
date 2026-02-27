import { useState } from 'react'

import type { ToolComponentProps } from '@/types'
import type { SshKeyInfo } from '@/utils/ssh-fingerprint'

import { CodeInput, CopyButton } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { analyzeSshKey } from '@/utils/ssh-fingerprint'

const toolEntry = TOOL_REGISTRY_MAP['ssh-key-fingerprint']

const ResultRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
    <span className="text-body-xs text-gray-400">{label}</span>
    <div className="flex items-center gap-1">
      <span className="font-mono text-body-xs text-gray-200">{value}</span>
      <CopyButton label={label} value={value} />
    </div>
  </div>
)

export const SshKeyFingerprint = (_props: ToolComponentProps) => {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<SshKeyInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const process = useDebounceCallback(async (val: string) => {
    if (!val.trim()) {
      setResult(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const info = await analyzeSshKey(val.trim())
      setResult(info)
    } catch (error) {
      setResult(null)
      toast({
        action: 'add',
        item: {
          label: error instanceof Error ? error.message : 'SSH key format not recognized',
          type: 'error',
        },
      })
    } finally {
      setLoading(false)
    }
  }, 300)

  const handleChange = (val: string) => {
    setInput(val)
    if (!val.trim()) {
      setResult(null)
      setLoading(false)
    } else {
      setLoading(true)
    }
    process(val)
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

      <CodeInput
        aria-label="SSH public key input"
        minHeight="100px"
        name="ssh-key-input"
        onChange={handleChange}
        placeholder="Paste SSH public key here..."
        value={input}
      />

      {loading && input.trim() && <p className="text-body-xs text-gray-400">Calculating...</p>}

      <div aria-live="polite" className="flex flex-col gap-2">
        {result && !loading && (
          <>
            <ResultRow label="Key Type" value={result.keyType} />
            <ResultRow label="Bit Size" value={String(result.bits)} />
            {result.comment && <ResultRow label="Comment" value={result.comment} />}
            <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
              <span className="text-body-xs text-gray-400">SHA256</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-body-xs text-gray-200">{result.sha256Fingerprint}</span>
                <CopyButton label="SHA256 Fingerprint" value={result.sha256Fingerprint} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded border border-gray-800 bg-gray-950 px-3 py-2">
              <span className="text-body-xs text-gray-400">MD5 (legacy)</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-body-xs text-gray-200">{result.md5Fingerprint}</span>
                <CopyButton label="MD5 Fingerprint" value={result.md5Fingerprint} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
