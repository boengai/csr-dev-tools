import { useEffect, useRef, useState } from 'react'

import { Button, CodeOutput, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useToast, useToolComputation } from '@/hooks'
import type { HtmlMdConvertMode, HtmlMdInput, ToolComponentProps } from '@/types'

const toolEntry = TOOL_REGISTRY_MAP['html-to-markdown-converter']

const sourceKey = (m: HtmlMdConvertMode) => `csr-dev-tools-${m}-source`

const readSource = (m: HtmlMdConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const HtmlToMarkdownConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [mode, setMode] = useInputLocalStorage<HtmlMdConvertMode>('csr-dev-tools-html-to-markdown-mode', 'html-to-markdown')
  const [source, setSource] = useState(() => readSource(mode))
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

  const { result, setInput, setInputImmediate } = useToolComputation<HtmlMdInput, string>(
    async ({ source: val, mode: m }) => {
      const { htmlToMarkdown, markdownToHtml } = await import('@/utils/html-markdown')
      return m === 'html-to-markdown' ? await htmlToMarkdown(val) : await markdownToHtml(val)
    },
    {
      debounceMs: 300,
      initial: '',
      isEmpty: ({ source: val }) => val.trim().length === 0,
      onError: () => {
        toast({
          action: 'add',
          item: { label: 'Conversion failed — please check your input', type: 'error' },
        })
      },
    },
  )

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) setInputImmediate({ source, mode })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    try {
      localStorage.setItem(sourceKey(modeRef.current), JSON.stringify(val))
    } catch {}
    setInput({ source: val, mode })
  }

  const openDialog = (m: HtmlMdConvertMode) => {
    setMode(m)
    modeRef.current = m
    const restored = readSource(m)
    setSource(restored)
    setDialogOpen(true)
    setInputImmediate({ source: restored, mode: m })
  }

  const handleReset = () => {
    setInputImmediate({ source: '', mode })
  }

  const isHtmlMode = mode === 'html-to-markdown'

  const sourceLabel = isHtmlMode ? 'HTML Input' : 'Markdown Input'
  const sourcePlaceholder = isHtmlMode
    ? '<h1>Hello</h1>\n<p>This is <strong>bold</strong> text.</p>'
    : '# Hello\n\nThis is **bold** text.'
  const resultLabel = isHtmlMode ? 'Markdown Output' : 'HTML Output'
  const resultPlaceholder = isHtmlMode
    ? '# Hello\n\nThis is **bold** text.'
    : '<h1>Hello</h1>\n<p>This is <strong>bold</strong> text.</p>'
  const dialogTitle = isHtmlMode ? 'HTML → Markdown' : 'Markdown → HTML'

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('html-to-markdown')} variant="default">
            HTML → Markdown
          </Button>
          <Button block onClick={() => openDialog('markdown-to-html')} variant="default">
            Markdown → HTML
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title={dialogTitle}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <FieldForm
                label={sourceLabel}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={sourcePlaceholder}
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
              <CodeOutput
                label={
                  <span className="flex items-center gap-1">
                    <span>{resultLabel}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                placeholder={resultPlaceholder}
                value={result}
              />
            </div>
          </div>
        </div>
      </ToolDialogShell>
    </>
  )
}
