import { MarkupToPdfShell } from '@/components/common/pdf'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { compileMarkdownToPdf } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['markdown-to-pdf']

export const MarkdownToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => (
  <MarkupToPdfShell
    autoOpen={autoOpen}
    compute={compileMarkdownToPdf}
    description={toolEntry?.description}
    filenameSlug="markdown"
    inputName="markdown-to-pdf-source"
    onAfterDialogClose={onAfterDialogClose}
    placeholder={'# Document Title\n\nWrite **markdown** here...'}
    sourceLabel="Markdown Input"
    storageKey="csr-dev-tools-markdown-to-pdf"
    title="Markdown to PDF"
    triggerLabel="Convert"
  />
)
