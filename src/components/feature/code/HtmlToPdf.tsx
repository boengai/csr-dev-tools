import { FieldForm, Pane, SplitPanel } from '@/components/common'
import { DownloadPdfButton, PdfSvgPreview } from '@/components/common/pdf'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolInput } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { CompileResultDto } from '@/types/wasm/pdf'
import { compileHtmlToPdf } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['html-to-pdf']

const EMPTY_RESULT: CompileResultDto = { svgs: [], pdf: new Uint8Array(0) }

export const HtmlToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const {
    input: source,
    result,
    setInput,
    reset,
  } = useToolInput<string, CompileResultDto>({
    compute: compileHtmlToPdf,
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
      title="HTML to PDF"
      triggers={[{ label: 'Convert' }]}
    >
      <div className="flex min-h-0 w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label="HTML Input"
              name="html-to-pdf-source"
              onChange={setInput}
              placeholder={'<h1>Document Title</h1>\n<p>Write <strong>HTML</strong> here...</p>'}
              type="code"
              value={source}
            />
          </Pane>

          <Pane live>
            <div className="flex items-center justify-between gap-1">
              <span className="text-body-xs font-medium text-gray-300">Preview</span>
              <DownloadPdfButton bytes={result.pdf} filename={`csr-dev-tools_html_${Date.now()}.pdf`} />
            </div>
            <PdfSvgPreview pages={result.svgs} />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}

