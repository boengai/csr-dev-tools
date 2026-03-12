import { useReducer, useRef } from 'react'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import type { InlineSpan, SideBySideRow, ToolComponentProps } from '@/types'
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

type State = {
  dialogOpen: boolean
  modified: string
  original: string
  rows: Array<SideBySideRow>
  unifiedDiff: string
}

type Action =
  | { type: 'SET_ORIGINAL'; payload: string }
  | { type: 'SET_MODIFIED'; payload: string }
  | { type: 'SET_DIFF_RESULT'; payload: { rows: Array<SideBySideRow>; unifiedDiff: string } }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ORIGINAL':
      return { ...state, original: action.payload }
    case 'SET_MODIFIED':
      return { ...state, modified: action.payload }
    case 'SET_DIFF_RESULT':
      return { ...state, rows: action.payload.rows, unifiedDiff: action.payload.unifiedDiff }
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'RESET':
      return { ...state, original: '', modified: '', rows: [], unifiedDiff: '' }
  }
}

export const TextDiffChecker = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, {
    original: '',
    modified: '',
    rows: [],
    unifiedDiff: '',
    dialogOpen: autoOpen ?? false,
  })
  const { original, modified, rows, unifiedDiff, dialogOpen } = state
  const { toast } = useToast()
  const sessionRef = useRef(0)

  const process = async (orig: string, mod: string) => {
    const session = ++sessionRef.current
    if (orig.trim().length === 0 && mod.trim().length === 0) {
      dispatch({ type: 'SET_DIFF_RESULT', payload: { rows: [], unifiedDiff: '' } })
      return
    }
    try {
      const [sideBySide, patch] = await Promise.all([computeSideBySideDiff(orig, mod), createUnifiedDiff(orig, mod)])
      if (session !== sessionRef.current) return
      dispatch({ type: 'SET_DIFF_RESULT', payload: { rows: sideBySide, unifiedDiff: patch } })
    } catch {
      if (session !== sessionRef.current) return
      dispatch({ type: 'SET_DIFF_RESULT', payload: { rows: [], unifiedDiff: '' } })
      toast({ action: 'add', item: { label: 'Unable to compute diff', type: 'error' } })
    }
  }

  const debouncedProcess = useDebounceCallback((orig: string, mod: string) => {
    process(orig, mod)
  }, 300)

  const handleOriginalChange = (val: string) => {
    dispatch({ type: 'SET_ORIGINAL', payload: val })
    debouncedProcess(val, modified)
  }

  const handleModifiedChange = (val: string) => {
    dispatch({ type: 'SET_MODIFIED', payload: val })
    debouncedProcess(original, val)
  }

  const handleReset = () => {
    sessionRef.current++
    dispatch({ type: 'RESET' })
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
          <Button block onClick={() => dispatch({ type: 'SET_DIALOG_OPEN', payload: true })} variant="default">
            Compare
          </Button>
        </div>
      </div>
      <Dialog
        injected={{
          open: dialogOpen,
          setOpen: (open: boolean) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open }),
        }}
        onAfterClose={handleAfterClose}
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
      </Dialog>
    </>
  )
}
