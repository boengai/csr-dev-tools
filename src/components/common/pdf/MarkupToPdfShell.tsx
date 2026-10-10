import { useToolComputationPersisted } from '@/hooks'
import type { MarkupToPdfShellProps } from '@/types'
import type { CompileResultDto } from '@/types/wasm/pdf'

import { ErrorBanner } from '../banner'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { FieldForm } from '../form'
import { Pane, SplitPanel } from '../layout'
import { DownloadPdfButton } from './DownloadPdfButton'
import { PdfSvgPreview } from './PdfSvgPreview'

// `CompileResultDto`'s empty shape is paired with `isEmpty: trim().length === 0`
// below. Both must move together — either side alone would flash stale output
// during the empty-bypass window. See CONTEXT.md → "Markup to PDF shell".
const EMPTY_RESULT: CompileResultDto = { svgs: [], pdf: new Uint8Array(0) }

// Single-string input today; both adopters (HtmlToPdf, MarkdownToPdf) need only
// the source markup. If a third adopter requires extras (pageFormat, includeToc,
// Typst preamble), swap the internal primitive from [[Persistent tool computation]]
// to [[Persistent tool field bag]] and migrate adopters — ~5 lines per adopter,
// no behavior change.
export const MarkupToPdfShell = ({
  autoOpen,
  compute,
  description,
  filenameSlug,
  inputName,
  onAfterDialogClose,
  placeholder,
  sourceLabel,
  storageKey,
  title,
  triggerLabel,
}: MarkupToPdfShellProps) => {
  const { error, input, result, setInput, setInputImmediate } = useToolComputationPersisted<string, CompileResultDto>({
    compute,
    debounceMs: 300,
    initial: '',
    initialResult: EMPTY_RESULT,
    isEmpty: (val) => val.trim().length === 0,
    storageKey,
  })

  const handleReset = () => setInputImmediate('')

  // Stale output is suppressed on error: when `error != null`, the shell hides
  // both <PdfSvgPreview> and <DownloadPdfButton> and surfaces err.message in an
  // inline banner. Prevents downloading bytes that don't match the displayed
  // source. See CONTEXT.md → "Markup to PDF shell" invariant 3.
  const hasError = error !== null
  const errorMessage = error instanceof Error ? error.message : 'Failed to render PDF'

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title={title}
      triggers={[{ label: triggerLabel }]}
    >
      <div className="flex min-h-0 w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <FieldForm
              label={sourceLabel}
              name={inputName}
              onChange={setInput}
              placeholder={placeholder}
              type="code"
              value={input}
            />
          </Pane>

          <Pane live>
            <div className="flex items-center justify-between gap-1">
              <span className="text-body-xs font-medium text-gray-300">Preview</span>
              {!hasError && <DownloadPdfButton bytes={result.pdf} filenameSlug={filenameSlug} />}
            </div>
            {hasError ? (
              <ErrorBanner variant="warning">{errorMessage}</ErrorBanner>
            ) : (
              <PdfSvgPreview pages={result.svgs} />
            )}
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
