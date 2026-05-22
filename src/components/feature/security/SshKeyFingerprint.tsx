import { CodeInput, InlineLabeledRow } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { analyzeSshKey, type SshKeyInfo } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['ssh-key-fingerprint']

export const SshKeyFingerprint = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { input, result, isPending: loading, setInput, reset } = useToolInput<string, SshKeyInfo | null>({
    compute: async (val) => analyzeSshKey(val.trim()),
    debounceMs: 300,
    errorFallback: 'SSH key format not recognized',
    initial: '',
    initialResult: null,
    isEmpty: (val) => !val.trim(),
  })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      size="default"
      title="SSH Key Fingerprint"
      triggers={[{ label: 'Analyze SSH Key' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <CodeInput
          aria-label="SSH public key input"
          minHeight="100px"
          name="ssh-key-input"
          onChange={setInput}
          placeholder="Paste SSH public key here..."
          value={input}
        />

        {loading && input.trim() && <p className="text-body-xs text-gray-400">Calculating...</p>}

        <div aria-live="polite" className="flex flex-col gap-2">
          {result && !loading && (
            <>
              <InlineLabeledRow label="Key Type" value={result.keyType} />
              <InlineLabeledRow label="Bit Size" value={String(result.bits)} />
              <InlineLabeledRow label="Comment" value={result.comment} />
              <InlineLabeledRow label="SHA256" value={result.sha256Fingerprint} />
              <InlineLabeledRow label="MD5 (legacy)" value={result.md5Fingerprint} />
            </>
          )}
        </div>
      </div>
    </ToolDialogFrame>
  )
}
