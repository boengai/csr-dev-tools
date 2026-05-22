import { useMemo } from 'react'

import { FieldForm, Pane, SplitPanel } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl, useToolInput } from '@/hooks'
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
      <div className="flex w-full grow flex-col gap-4">
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
              <DownloadPdfButton bytes={result.pdf} />
            </div>
            <PdfPreview pages={result.svgs} />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}

type PdfPreviewProps = { pages: Array<string> }

const PdfPreview = ({ pages }: PdfPreviewProps) => {
  if (pages.length === 0) {
    return (
      <div
        aria-label="Empty preview"
        className="grid min-h-[300px] grow place-items-center rounded-lg border-2 border-gray-900 bg-gray-950 p-4 text-body-xs text-gray-500"
      >
        Start typing to see a preview.
      </div>
    )
  }

  return (
    <div className="grow space-y-3 overflow-auto rounded-lg border-2 border-gray-900 bg-white p-4">
      {pages.map((svg, i) => (
        // SVG comes from our own Rust WASM (Typst output); never user-supplied HTML.
        <div
          aria-label={`Page ${i + 1}`}
          className="mx-auto w-full max-w-full [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
          key={i}
        />
      ))}
    </div>
  )
}

type DownloadPdfButtonProps = { bytes: Uint8Array }

const DownloadPdfButton = ({ bytes }: DownloadPdfButtonProps) => {
  const blob = useMemo(() => {
    if (bytes.byteLength === 0) return null
    return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
  }, [bytes])

  const href = useBlobUrl(blob)

  if (href === null) {
    return (
      <button
        className="rounded-md bg-gray-800 px-3 py-1 text-body-xs font-medium text-gray-500"
        disabled
        type="button"
      >
        Download PDF
      </button>
    )
  }

  return (
    <a
      className="rounded-md bg-blue-600 px-3 py-1 text-body-xs font-medium text-white hover:bg-blue-500"
      download="html.pdf"
      href={href}
    >
      Download PDF
    </a>
  )
}
