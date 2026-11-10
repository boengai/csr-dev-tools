import { CodecShell } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { CodecMode, HtmlMdConvertMode, ToolComponentProps } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['html-to-markdown-converter']

const MODES: [CodecMode<HtmlMdConvertMode>, CodecMode<HtmlMdConvertMode>] = [
  {
    key: 'html-to-markdown',
    label: 'HTML → Markdown',
    resultLabel: 'Markdown Output',
    resultPlaceholder: 'Paste HTML to convert it to Markdown',
    sourceLabel: 'HTML Input',
    sourcePlaceholder: '<h1>Hello</h1>\n<p>This is <strong>bold</strong> text.</p>',
  },
  {
    key: 'markdown-to-html',
    label: 'Markdown → HTML',
    resultLabel: 'HTML Output',
    resultPlaceholder: 'Write Markdown to convert it to HTML',
    sourceLabel: 'Markdown Input',
    sourcePlaceholder: '# Hello\n\nThis is **bold** text.',
  },
]

const compute = async ({ mode, source }: { mode: HtmlMdConvertMode; source: string }): Promise<{ output: string }> => {
  const { htmlToMarkdown, markdownToHtml } = await import('@/wasm/markdown')
  const output = mode === 'html-to-markdown' ? await htmlToMarkdown(source) : await markdownToHtml(source)
  return { output }
}

export const HtmlToMarkdownConverter = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <CodecShell
    autoOpen={autoOpen}
    compute={compute}
    description={toolEntry?.description}
    initialResult={{ output: '' }}
    modeStorageKey="html-to-markdown"
    modes={MODES}
    onAfterClose={onAfterClose}
  />
)
