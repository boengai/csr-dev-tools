import { BidirectionalConverter } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ConverterMode, HtmlMdConvertMode, ToolComponentProps } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['html-to-markdown-converter']

const MODES: [ConverterMode<HtmlMdConvertMode>, ConverterMode<HtmlMdConvertMode>] = [
  {
    key: 'html-to-markdown',
    label: 'HTML → Markdown',
    resultLabel: 'Markdown Output',
    resultPlaceholder: '# Hello\n\nThis is **bold** text.',
    sourceLabel: 'HTML Input',
    sourcePlaceholder: '<h1>Hello</h1>\n<p>This is <strong>bold</strong> text.</p>',
  },
  {
    key: 'markdown-to-html',
    label: 'Markdown → HTML',
    resultLabel: 'HTML Output',
    resultPlaceholder: '<h1>Hello</h1>\n<p>This is <strong>bold</strong> text.</p>',
    sourceLabel: 'Markdown Input',
    sourcePlaceholder: '# Hello\n\nThis is **bold** text.',
  },
]

const compute = async ({ mode, source }: { mode: HtmlMdConvertMode; source: string }): Promise<string> => {
  const { htmlToMarkdown, markdownToHtml } = await import('@/utils/html-markdown')
  return mode === 'html-to-markdown' ? await htmlToMarkdown(source) : await markdownToHtml(source)
}

export const HtmlToMarkdownConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => (
  <BidirectionalConverter
    autoOpen={autoOpen}
    compute={compute}
    description={toolEntry?.description}
    modeStorageKey="html-to-markdown"
    modes={MODES}
    onAfterDialogClose={onAfterDialogClose}
    onError={() => undefined}
  />
)
