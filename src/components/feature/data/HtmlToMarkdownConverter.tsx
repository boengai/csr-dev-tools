import { useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'

type ConvertMode = 'html-to-markdown' | 'markdown-to-html'

const toolEntry = TOOL_REGISTRY_MAP['html-to-markdown-converter']

export const HtmlToMarkdownConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<ConvertMode>('html-to-markdown')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const sessionRef = useRef(0)

  const process = async (val: string, m: ConvertMode) => {
    const session = ++sessionRef.current
    if (val.trim().length === 0) {
      setResult('')
      return
    }
    try {
      const { htmlToMarkdown, markdownToHtml } = await import('@/utils/html-markdown')
      const converted = m === 'html-to-markdown' ? await htmlToMarkdown(val) : await markdownToHtml(val)
      if (session !== sessionRef.current) return
      setResult(converted)
    } catch {
      if (session !== sessionRef.current) return
      setResult('')
      toast({
        action: 'add',
        item: { label: 'Conversion failed — please check your input', type: 'error' },
      })
    }
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val, mode)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    sessionRef.current++
    setMode(m)
    setSource('')
    setResult('')
    setDialogOpen(true)
  }

  const handleReset = () => {
    sessionRef.current++
    setSource('')
    setResult('')
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
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => openDialog('html-to-markdown')} variant="default">
            HTML → Markdown
          </Button>
          <Button block onClick={() => openDialog('markdown-to-html')} variant="default">
            Markdown → HTML
          </Button>
        </div>
      </div>
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title={dialogTitle}
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label={sourceLabel}
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder={sourcePlaceholder}
                rows={12}
                type="textarea"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                disabled={!result}
                label={
                  <span className="flex items-center gap-1">
                    <span>{resultLabel}</span>
                    <CopyButton label="result" value={result} />
                  </span>
                }
                name="result"
                placeholder={resultPlaceholder}
                rows={12}
                type="textarea"
                value={result}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
