import { useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CodeOutput, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useLocalStorage, useToast } from '@/hooks'

type ConvertMode = 'html-to-markdown' | 'markdown-to-html'

const toolEntry = TOOL_REGISTRY_MAP['html-to-markdown-converter']

const sourceKey = (m: ConvertMode) => `csr-dev-tools-${m}-source`

const readSource = (m: ConvertMode): string => {
  try {
    const item = localStorage.getItem(sourceKey(m))
    return item !== null ? (JSON.parse(item) as string) : ''
  } catch {
    return ''
  }
}

export const HtmlToMarkdownConverter = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [mode, setMode] = useLocalStorage<ConvertMode>('csr-dev-tools-html-to-markdown-mode', 'html-to-markdown')
  const [source, setSource] = useState(() => readSource(mode))
  const [result, setResult] = useState('')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const { toast } = useToast()
  const sessionRef = useRef(0)
  const initializedRef = useRef(false)
  const modeRef = useRef(mode)

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

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (source) process(source, mode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleSourceChange = (val: string) => {
    setSource(val)
    try { localStorage.setItem(sourceKey(modeRef.current), JSON.stringify(val)) } catch {}
    processInput(val)
  }

  const openDialog = (m: ConvertMode) => {
    sessionRef.current++
    setMode(m)
    modeRef.current = m
    const restored = readSource(m)
    setSource(restored)
    setResult('')
    setDialogOpen(true)
    if (restored.trim()) process(restored, m)
  }

  const handleReset = () => {
    sessionRef.current++
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
      </Dialog>
    </>
  )
}
