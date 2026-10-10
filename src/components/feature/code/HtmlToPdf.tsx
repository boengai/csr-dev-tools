import { MarkupToPdfShell } from '@/components/common/pdf'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { compileHtmlToPdf } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['html-to-pdf']

export const HtmlToPdf = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <MarkupToPdfShell
    autoOpen={autoOpen}
    compute={compileHtmlToPdf}
    description={toolEntry?.description}
    filenameSlug="html"
    inputName="html-to-pdf-source"
    onAfterClose={onAfterClose}
    placeholder={'<h1>Document Title</h1>\n<p>Write <strong>HTML</strong> here...</p>'}
    sourceLabel="HTML Input"
    storageKey="csr-dev-tools-html-to-pdf"
    title="HTML to PDF"
    triggerLabel="Convert"
  />
)
