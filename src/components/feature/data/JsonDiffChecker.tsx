import { CopyButton, FieldForm } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolFieldsPersisted } from '@/hooks'
import type { InlineSpan, JsonDiffInput, JsonDiffResult, SideBySideRow, ToolComponentProps } from '@/types'
import { computeSideBySideDiff, createUnifiedDiff, getJsonDiffError, normalizeJson } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['json-diff-checker']

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

const EMPTY_DIFF: JsonDiffResult = { rows: [], unifiedDiff: '', validationError: '' }

export const JsonDiffChecker = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const { toast } = useToast()

  const { inputs, result, reset, setFields } = useToolFieldsPersisted<JsonDiffInput, JsonDiffResult>({
    compute: async ({ original: orig, modified: mod }) => {
      const origError = await getJsonDiffError(orig, 'Original')
      const modError = await getJsonDiffError(mod, 'Modified')
      if (origError || modError) {
        return { rows: [], unifiedDiff: '', validationError: (origError ?? modError) as string }
      }

      const normalizedOrig = orig.trim().length === 0 ? '' : await normalizeJson(orig)
      const normalizedMod = mod.trim().length === 0 ? '' : await normalizeJson(mod)

      const [sideBySide, patch] = await Promise.all([
        computeSideBySideDiff(normalizedOrig, normalizedMod),
        createUnifiedDiff(normalizedOrig, normalizedMod),
      ])
      return { rows: sideBySide, unifiedDiff: patch, validationError: '' }
    },
    debounceMs: 300,
    initial: { original: '', modified: '' },
    initialResult: EMPTY_DIFF,
    isEmpty: ({ original: orig, modified: mod }) => orig.trim().length === 0 && mod.trim().length === 0,
    onError: () => {
      toast({ action: 'add', item: { label: 'Unable to compute JSON diff', type: 'error' } })
    },
    storageKey: 'csr-dev-tools-json-diff',
  })
  const { original, modified } = inputs
  const { rows, unifiedDiff, validationError } = result

  const handleOriginalChange = (val: string) => setFields({ original: val })
  const handleModifiedChange = (val: string) => setFields({ modified: val })

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="JSON Diff Checker"
      triggers={[{ label: 'Compare' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 tablet:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="Original"
              name="original"
              onChange={handleOriginalChange}
              placeholder='{"key": "paste JSON here..."}'
              type="code"
              value={original}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <FieldForm
              label="Modified"
              name="modified"
              onChange={handleModifiedChange}
              placeholder='{"key": "paste JSON here..."}'
              type="code"
              value={modified}
            />
          </div>
        </div>

        <div className="border-t-2 border-dashed border-gray-900" />

        {validationError && (
          <p className="text-body-sm text-error" role="alert">
            {validationError}
          </p>
        )}

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
