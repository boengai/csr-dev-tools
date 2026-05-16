import DOMPurify from 'dompurify'
import { useEffect, useRef, useState } from 'react'

import { CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { renderMarkdown } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['markdown-preview']

export const MarkdownPreview = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [source, setSource] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  const {
    result: htmlOutput,
    setInput,
    setInputImmediate,
  } = useToolComputation<string, string>(renderMarkdown, {
    debounceMs: 300,
    initial: '',
    isEmpty: (val) => val.trim().length === 0,
  })

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = DOMPurify.sanitize(htmlOutput)
    }
  }, [htmlOutput])

  const handleSourceChange = (val: string) => {
    setSource(val)
    setInput(val)
  }

  const handleReset = () => {
    setSource('')
    setInputImmediate('')
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="Markdown Preview"
      triggers={[{ label: 'Preview' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex size-full grow flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
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

          <div aria-live="polite" className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-body-xs font-medium text-gray-300">Preview</span>
              <CopyButton label="HTML source" value={htmlOutput} />
            </div>
            <div
              className="prose min-h-[300px] grow overflow-auto rounded-lg border-2 border-gray-900 bg-gray-950 p-4 prose-invert"
              ref={previewRef}
            />
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
