import { CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useInputLocalStorage, useMountOnce, useToast, useToolComputation } from '@/hooks'
import type { InlineSpan, SideBySideRow, TextDiffInput, TextDiffResult, ToolComponentProps } from '@/types'
import { computeSideBySideDiff, createUnifiedDiff } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['text-diff-checker']

const EMPTY_DIFF: TextDiffResult = { rows: [], unifiedDiff: '' }

const renderSpans = (spans: Array<InlineSpan>, side: 'left' | 'right') => {
  let offset = 0
  return spans.map((span) => {
    const key = `${side}-${offset}`
    offset += span.text.length
    if (span.type === 'equal') return <span key={key}>{span.text}</span>
    const highlight = side === 'left' ? 'bg-error/25' : 'bg-success/25'
    return (
      <span className={highlight} key={key}>
        {span.text}
      </span>
    )
  })
}

const DiffCell = ({
  content,
  lineNum,
  spans,
  type,
  side,
}: {
  content: string
  lineNum: number | null
  side: 'left' | 'right'
  spans: Array<InlineSpan> | null
  type: SideBySideRow['leftType']
}) => {
  return (
    <div className="flex data-[state=added]:bg-success/10 data-[state=removed]:bg-error/10" data-state={type}>
      <span className="w-10 shrink-0 py-px pr-2 text-right text-gray-600 select-none">{lineNum ?? ''}</span>
      <span
        className="w-0.5 shrink-0 bg-transparent data-[state=added]:bg-success data-[state=removed]:bg-error"
        data-state={type}
      />
      <span
        className="min-w-0 flex-1 py-px pl-2 text-gray-400 data-[state=added]:text-success data-[state=removed]:text-error"
        data-state={type}
      >
        {type === 'empty' ? '' : spans ? renderSpans(spans, side) : content || ' '}
      </span>
    </div>
  )
}

export const TextDiffChecker = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [inputs, setInputs] = useInputLocalStorage('csr-dev-tools-text-diff', { original: '', modified: '' })
  const { original, modified } = inputs
  const { toast } = useToast()

  const { result, setInput, setInputImmediate } = useToolComputation<TextDiffInput, TextDiffResult>(
    async ({ original: orig, modified: mod }) => {
      const [sideBySide, patch] = await Promise.all([computeSideBySideDiff(orig, mod), createUnifiedDiff(orig, mod)])
      return { rows: sideBySide, unifiedDiff: patch }
    },
    {
      debounceMs: 300,
      initial: EMPTY_DIFF,
      isEmpty: ({ original: orig, modified: mod }) => orig.trim().length === 0 && mod.trim().length === 0,
      onError: () => {
        toast({ action: 'add', item: { label: 'Unable to compute diff', type: 'error' } })
      },
    },
  )

  const { rows, unifiedDiff } = result

  useMountOnce(() => {
    if (original || modified) setInputImmediate({ original, modified })
  })

  const handleOriginalChange = (val: string) => {
    setInputs((prev) => ({ ...prev, original: val }))
    setInput({ original: val, modified })
  }

  const handleModifiedChange = (val: string) => {
    setInputs((prev) => ({ ...prev, modified: val }))
    setInput({ original, modified: val })
  }

  const handleReset = () => {
    setInputs({ original: '', modified: '' })
    setInputImmediate({ original: '', modified: '' })
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title="Text Diff Checker"
      triggers={[{ label: 'Compare' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="Original"
              name="original"
              onChange={handleOriginalChange}
              placeholder="Paste original text here..."
              type="code"
              value={original}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="Modified"
              name="modified"
              onChange={handleModifiedChange}
              placeholder="Paste modified text here..."
              type="code"
              value={modified}
            />
          </div>
        </div>

        <div className="border-t-2 border-dashed border-gray-900" />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-body-sm font-medium text-gray-400">Diff Output</span>
            {unifiedDiff && <CopyButton label="diff" value={unifiedDiff} />}
          </div>
          <div
            aria-label="Diff output"
            aria-live="polite"
            className="text-sm overflow-auto rounded-lg border border-gray-800 bg-gray-950 font-mono"
            role="region"
          >
            {rows.length > 0 ? (
              <>
                <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-gray-800 bg-gray-950">
                  <div className="text-xs px-3 py-1.5 font-medium text-gray-500">Original</div>
                  <div className="text-xs border-l border-gray-800 px-3 py-1.5 font-medium text-gray-500">
                    Modified
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  {rows.map((row) => (
                    <div
                      className="col-span-2 grid grid-cols-subgrid"
                      key={`${row.leftLineNum ?? 'e'}-${row.rightLineNum ?? 'e'}-${row.leftType}-${row.rightType}`}
                    >
                      <DiffCell
                        content={row.leftContent}
                        lineNum={row.leftLineNum}
                        side="left"
                        spans={row.leftSpans}
                        type={row.leftType}
                      />
                      <div className="border-l border-gray-800">
                        <DiffCell
                          content={row.rightContent}
                          lineNum={row.rightLineNum}
                          side="right"
                          spans={row.rightSpans}
                          type={row.rightType}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="p-3 text-gray-600">Diff output will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </ToolDialogFrame>
  )
}
