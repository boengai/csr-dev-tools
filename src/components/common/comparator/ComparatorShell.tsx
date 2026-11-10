import { memo } from 'react'

import { useToolFields } from '@/hooks'
import type { DiffCellProps, ComparatorShellProps, DiffInput, DiffOutput, DiffRowsProps, InlineSpan } from '@/types'

import { ToolStatus } from '../banner'
import { CopyButton } from '../button'
import { ToolDialogFrame } from '../dialog/ToolDialogFrame'
import { FieldForm } from '../form'
import { Pane } from '../layout'

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

const DiffCell = ({ content, lineNum, side, spans, type }: DiffCellProps) => {
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

// Memoized on `rows` (the pipeline result identity) so typing in either
// editor re-renders the inputs but not the whole diff grid.
const DiffRows = memo(({ rows }: DiffRowsProps) => (
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
))

export const ComparatorShell = <R extends DiffOutput>({
  autoOpen,
  compute,
  description,
  errorFallback,
  errorLabel,
  initialResult,
  modifiedPlaceholder,
  notices,
  onAfterClose,
  originalPlaceholder,
  storageKey,
  title,
}: ComparatorShellProps<R>) => {
  // No errorLabel / errorFallback passed to the pipeline: input errors never
  // toast. The shell shows them in the status slot (CONTEXT.md → Tool status slot).
  const { error, inputs, result, reset, setFields } = useToolFields<DiffInput, R>({
    compute,
    debounceMs: 300,
    initial: { original: '', modified: '' },
    initialResult,
    isEmpty: ({ original, modified }) => original.trim().length === 0 && modified.trim().length === 0,
    storageKey,
  })
  const { original, modified } = inputs
  // A stale diff next to an error banner reads as valid output — clear it.
  const { rows, unifiedDiff } = error != null ? initialResult : result

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterClose}
      onReset={reset}
      title={title}
      triggers={[{ label: 'Compare' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <ToolStatus error={error} errorFallback={errorFallback} errorLabel={errorLabel} notices={notices?.(result)} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 tablet:flex-row">
          <Pane>
            <FieldForm
              label="Original"
              name="original"
              onChange={(val: string) => setFields({ original: val })}
              placeholder={originalPlaceholder}
              type="code"
              value={original}
            />
          </Pane>

          <Pane>
            <FieldForm
              label="Modified"
              name="modified"
              onChange={(val: string) => setFields({ modified: val })}
              placeholder={modifiedPlaceholder}
              type="code"
              value={modified}
            />
          </Pane>
        </div>

        <div className="border-t-2 border-dashed border-gray-900" />

        <Pane>
          <div className="contents" data-slot="tool-output">
            <div className="flex items-center gap-1">
              <span className="text-body-sm font-medium text-gray-400">Diff Output</span>
              <CopyButton label="diff" value={unifiedDiff} />
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
                  <DiffRows rows={rows} />
                </>
              ) : (
                <p className="p-3 text-gray-600" data-slot="empty-state">
                  Paste text into Original and Modified to see the differences
                </p>
              )}
            </div>
          </div>
        </Pane>
      </div>
    </ToolDialogFrame>
  )
}
