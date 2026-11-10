import { TransformerShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { renderMarkdown } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['markdown-preview']

const INITIAL = { source: '' }

// The shell sanitises the HTML before showing it, and Copy takes that
// sanitised HTML — what you see is what you copy.
export const MarkdownPreview = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <TransformerShell<{ source: string }, 'markup'>
    autoOpen={autoOpen}
    compute={({ source }) => renderMarkdown(source)}
    description={toolEntry?.description}
    initial={INITIAL}
    onAfterClose={onAfterClose}
    outputKind="markup"
    // Never saved before the shell; kept that way.
    persistInput={false}
    resultLabel="HTML Preview"
    resultPlaceholder="Write Markdown on the left to preview it here"
    sourceLabel="Markdown Input"
    sourcePlaceholder={'# Hello World\n\nWrite **markdown** here...'}
    title="Markdown Preview"
    triggerLabel="Preview"
  />
)
