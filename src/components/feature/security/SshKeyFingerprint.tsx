import { useState } from 'react'

import { CodeInput, CopyButton } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { analyzeSshKey, type SshKeyInfo } from '@/utils'

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

export const SshKeyFingerprint = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [input, setInputValue] = useState('')
  const { showError } = useToast()

  const {
    result,
    isPending: loading,
    setInput,
    setInputImmediate,
  } = useToolComputation<string, SshKeyInfo | null>(async (val) => analyzeSshKey(val.trim()), {
    debounceMs: 300,
    initial: null,
    isEmpty: (val) => !val.trim(),
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'SSH key format not recognized')
    },
  })

  const handleChange = (val: string) => {
    setInputValue(val)
    setInput(val)
  }

  const handleReset = () => {
    setInputValue('')
    setInputImmediate('')
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      size="default"
      title="SSH Key Fingerprint"
      triggers={[{ label: 'Analyze SSH Key' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
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
    </ToolDialogFrame>
  )
}
