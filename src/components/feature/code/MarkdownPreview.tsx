import { useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback } from '@/hooks'
import { renderMarkdown } from '@/utils/markdown'

const toolEntry = TOOL_REGISTRY_MAP['markdown-preview']

export const MarkdownPreview = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const [htmlOutput, setHtmlOutput] = useState('')
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  const process = (val: string) => {
    if (val.trim().length === 0) {
      setHtmlOutput('')
      return
    }
    setHtmlOutput(renderMarkdown(val))
  }

  const processInput = useDebounceCallback((val: string) => {
    process(val)
  }, 300)

  const handleSourceChange = (val: string) => {
    setSource(val)
    processInput(val)
  }

  const handleReset = () => {
    setSource('')
    setHtmlOutput('')
  }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Preview
          </Button>
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleAfterClose}
        size="screen"
        title="Markdown Preview"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Markdown Input"
                name="dialog-source"
                onChange={handleSourceChange}
                placeholder="# Hello World\n\nWrite **markdown** here..."
                type="code"
                value={source}
              />
            </div>

            <div className="border-t-2 border-dashed border-gray-900 tablet:border-t-0 tablet:border-l-2" />

            <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="text-body-xs font-medium text-gray-300">Preview</span>
                <CopyButton label="HTML source" value={htmlOutput} />
              </div>
              <div
                className="prose min-h-[300px] grow overflow-auto rounded-lg border-2 border-gray-900 bg-gray-950 p-4 prose-invert"
                dangerouslySetInnerHTML={{ __html: htmlOutput }}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
