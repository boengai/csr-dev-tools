import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { analyzeSshKey } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['ssh-key-fingerprint']

const INITIAL: { source: string } = { source: '' }

export const SshKeyFingerprint = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={async ({ source }) => {
      const info = await analyzeSshKey(source.trim())
      return [
        { label: 'Key Type', value: info.keyType },
        { label: 'Bit Size', value: String(info.bits) },
        info.comment ? { label: 'Comment', value: info.comment } : { copy: false, label: 'Comment', value: '(none)' },
        { label: 'SHA256', value: info.sha256Fingerprint },
        { label: 'MD5 (legacy)', value: info.md5Fingerprint },
      ]
    }}
    description={toolEntry?.description}
    errorFallback="SSH key format not recognized"
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="fields"
    // Keys are not newly persisted: nothing pasted here reaches localStorage.
    persistInput={false}
    resultLabel="Key details"
    resultPlaceholder="Paste an SSH public key to see its fingerprints"
    sourceLabel="SSH public key"
    sourcePlaceholder="ssh-ed25519 AAAA... user@host"
    title="SSH Key Fingerprint"
    triggerLabel="Analyze SSH Key"
  />
)
