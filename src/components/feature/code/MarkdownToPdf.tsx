import { FieldForm, Pane, SplitPanel } from '@/components/common'
import { DownloadPdfButton, PdfSvgPreview } from '@/components/common/pdf'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { CompileResultDto } from '@/types/wasm/pdf'
import { compileMarkdownToPdf } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['markdown-to-pdf']

const EMPTY_RESULT: CompileResultDto = { svgs: [], pdf: new Uint8Array(0) }

export const MarkdownToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const {
    input: source,
    result,
    setInput,
    reset,
  } = useToolInput<string, CompileResultDto>({
    compute: compileMarkdownToPdf,
    debounceMs: 300,
    initial: '',
    initialResult: EMPTY_RESULT,
    isEmpty: (val) => val.trim().length === 0,
  })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="Markdown to PDF"
      triggers={[{ label: 'Convert' }]}
    >
      <div className="flex min-h-0 w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="Markdown Input"
              name="markdown-to-pdf-source"
              onChange={setInput}
              placeholder={'# Document Title\n\nWrite **markdown** here...'}
              type="code"
              value={source}
            />
          </Pane>

          <Pane live>
            <div className="flex items-center justify-between gap-1">
              <span className="text-body-xs font-medium text-gray-300">Preview</span>
              <DownloadPdfButton bytes={result.pdf} filename="markdown.pdf" />
            </div>
            <PdfSvgPreview pages={result.svgs} />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}

