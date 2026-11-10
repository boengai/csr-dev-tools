import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps, TransformerField } from '@/types'
import { parseUrl } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['url-parser']

const INITIAL: { source: string } = { source: '' }

/** A part the URL leaves out reads as `fallback`, with nothing to copy. */
const part = (label: string, value: string, fallback: string): TransformerField =>
  value ? { label, value } : { copy: false, label, value: fallback }

export const UrlParser = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'fields'>
    autoOpen={autoOpen}
    compute={({ source }) => {
      const url = parseUrl(source.trim())
      // parseUrl returns its error as data; the shell shows thrown errors in the status slot.
      if (url.error) throw new Error(url.error)
      return [
        { label: 'Protocol', value: url.protocol },
        { label: 'Hostname', value: url.hostname },
        part('Port', url.port, 'default'),
        { label: 'Path', value: url.pathname },
        part('Hash', url.hash, '(none)'),
        part('Query String', url.search, '(none)'),
        ...url.searchParams.map(({ key, value }) => ({ label: `Query: ${key}`, value })),
      ]
    }}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="fields"
    resultLabel="URL parts"
    resultPlaceholder="Enter a URL to break it into parts"
    sourceKind="text"
    sourceLabel="URL"
    sourcePlaceholder="https://example.com:8080/path?key=value#section"
    // URLs can carry tokens and signed parameters: never write them to localStorage.
    persistInput={false}
    title="URL Parser"
    triggerLabel="Parse"
  />
)
