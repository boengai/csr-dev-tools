import { useEffect, useReducer, useRef, useState } from 'react'

import { Button, CopyButton, FieldForm } from '@/components/common'
import { ToolDialogShell } from '@/components/common/dialog/ToolDialogShell'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useInputLocalStorage, useStaleSafeAsync, useToast } from '@/hooks'
import type { InlineSpan, SideBySideRow, ToolComponentProps } from '@/types'
import type { State, Action } from '@/types/components/feature/text/textDiffChecker'
import { computeSideBySideDiff, createUnifiedDiff } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['text-diff-checker']

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

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DIFF_RESULT':
      return { ...state, rows: action.payload.rows, unifiedDiff: action.payload.unifiedDiff }
    case 'RESET':
      return { ...state, rows: [], unifiedDiff: '' }
  }
}

export const TextDiffChecker = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [inputs, setInputs] = useInputLocalStorage('csr-dev-tools-text-diff', { original: '', modified: '' })
  const { original, modified } = inputs
  const [state, dispatch] = useReducer(reducer, {
    rows: [],
    unifiedDiff: '',
  })
  const { rows, unifiedDiff } = state
  const { toast } = useToast()
  const newSession = useStaleSafeAsync()
  const initializedRef = useRef(false)

  const process = async (orig: string, mod: string) => {
    const session = newSession()
    if (orig.trim().length === 0 && mod.trim().length === 0) {
      dispatch({ type: 'SET_DIFF_RESULT', payload: { rows: [], unifiedDiff: '' } })
      return
    }
    try {
      const [sideBySide, patch] = await Promise.all([computeSideBySideDiff(orig, mod), createUnifiedDiff(orig, mod)])
      if (!session.isFresh()) return
      dispatch({ type: 'SET_DIFF_RESULT', payload: { rows: sideBySide, unifiedDiff: patch } })
    } catch {
      if (!session.isFresh()) return
      dispatch({ type: 'SET_DIFF_RESULT', payload: { rows: [], unifiedDiff: '' } })
      toast({ action: 'add', item: { label: 'Unable to compute diff', type: 'error' } })
    }
  }

  const debouncedProcess = useDebounceCallback((orig: string, mod: string) => {
    process(orig, mod)
  }, 300)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (original || modified) process(original, modified)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleOriginalChange = (val: string) => {
    setInputs((prev) => ({ ...prev, original: val }))
    debouncedProcess(val, modified)
  }

  const handleModifiedChange = (val: string) => {
    setInputs((prev) => ({ ...prev, modified: val }))
    debouncedProcess(original, val)
  }

  const handleReset = () => {
    newSession()
    setInputs({ original: '', modified: '' })
    dispatch({ type: 'RESET' })
  }

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <div className="flex grow flex-col items-center justify-center gap-2">
          <Button block onClick={() => setDialogOpen(true)} variant="default">
            Compare
          </Button>
        </div>
      </div>
      <ToolDialogShell
        onAfterDialogClose={onAfterDialogClose}
        onOpenChange={setDialogOpen}
        onReset={handleReset}
        open={dialogOpen}
        size="screen"
        title="Text Diff Checker"
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
      </ToolDialogShell>
    </>
  )
}
