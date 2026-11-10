import { Button, TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps, TransformerField } from '@/types'
import { parseUserAgent } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['user-agent-parser']

const INITIAL: { source: string } = { source: '' }

const fmt = (name: string, version: string) => (version ? `${name} ${version}` : name)

/** A part the parser could not find reads as `—`, with nothing to copy. */
const row = (label: string, value: string): TransformerField =>
  value ? { label, value } : { copy: false, label, value: '—' }

export const UserAgentParser = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={({ source }) => {
      const { browser, device, engine, os } = parseUserAgent(source)
      return [
        row('Browser', fmt(browser.name, browser.version)),
        row('OS', fmt(os.name, os.version)),
        row('Device', device),
        row('Engine', fmt(engine.name, engine.version)),
      ]
    }}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="fields"
    renderControls={({ setFieldsImmediate }) => (
      <Button
        onClick={() => {
          if (typeof navigator !== 'undefined') setFieldsImmediate({ source: navigator.userAgent })
        }}
        size="small"
      >
        Use my UA
      </Button>
    )}
    resultLabel="Parsed"
    resultPlaceholder="Paste a user agent string, or use yours, to parse it"
    sourceKind="text"
    sourceLabel="User Agent String"
    sourcePlaceholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) ..."
    storageKey="csr-dev-tools-user-agent-parser"
    title="User Agent Parser"
    triggerLabel="Parse"
  />
)
