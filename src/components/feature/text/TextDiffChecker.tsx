import { useRef, useState } from 'react'

import type { InlineSpan, SideBySideRow } from '@/utils'

import { Button, CopyButton, Dialog, FieldForm } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError } from '@/hooks'
import { computeSideBySideDiff, createUnifiedDiff } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['text-diff-checker']

const renderSpans = (spans: Array<InlineSpan>, side: 'left' | 'right') => {
  return spans.map((span, i) => {
    if (span.type === 'equal') return <span key={i}>{span.text}</span>
    const highlight = side === 'left' ? 'bg-error/25' : 'bg-success/25'
    return (
      <span className={highlight} key={i}>
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
  const bgClass = type === 'removed' ? 'bg-error/10' : type === 'added' ? 'bg-success/10' : ''
  const textClass = type === 'removed' ? 'text-error' : type === 'added' ? 'text-success' : 'text-gray-400'
  const barClass = type === 'removed' ? 'bg-error' : type === 'added' ? 'bg-success' : 'bg-transparent'

  return (
    <div className={`flex ${bgClass}`}>
      <span className="w-10 shrink-0 py-px pr-2 text-right text-gray-600 select-none">{lineNum ?? ''}</span>
      <span className={`w-0.5 shrink-0 ${barClass}`} />
      <span className={`min-w-0 flex-1 py-px pl-2 ${textClass}`}>
        {type === 'empty' ? '' : spans ? renderSpans(spans, side) : content || ' '}
      </span>
    </div>
  )
}

export const TextDiffChecker = () => {
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [rows, setRows] = useState<Array<SideBySideRow>>([])
  const [unifiedDiff, setUnifiedDiff] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { clearError, error, setError } = useToolError()
  const sessionRef = useRef(0)

  const process = async (orig: string, mod: string) => {
    const session = ++sessionRef.current
    if (orig.trim().length === 0 && mod.trim().length === 0) {
      setRows([])
      setUnifiedDiff('')
      clearError()
      return
    }
    try {
      const [sideBySide, patch] = await Promise.all([computeSideBySideDiff(orig, mod), createUnifiedDiff(orig, mod)])
      if (session !== sessionRef.current) return
      setRows(sideBySide)
      setUnifiedDiff(patch)
      clearError()
    } catch {
      if (session !== sessionRef.current) return
      setRows([])
      setUnifiedDiff('')
      setError('Unable to compute diff')
    }
  }

  const debouncedProcess = useDebounceCallback((orig: string, mod: string) => {
    process(orig, mod)
  }, 150)

  const handleOriginalChange = (val: string) => {
    setOriginal(val)
    debouncedProcess(val, modified)
  }

  const handleModifiedChange = (val: string) => {
    setModified(val)
    debouncedProcess(original, val)
  }

  const handleReset = () => {
    sessionRef.current++
    setOriginal('')
    setModified('')
    setRows([])
    setUnifiedDiff('')
    clearError()
  }

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <div className="flex grow flex-col items-center justify-center gap-2">
        <Button block onClick={() => setDialogOpen(true)} variant="default">
          Compare
        </Button>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title="Text Diff Checker"
      >
        <div className="flex w-full grow flex-col gap-4">
          <div className="tablet:flex-row flex min-h-0 flex-1 flex-col gap-6">
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Original"
                name="original"
                onChange={handleOriginalChange}
                placeholder="Paste original text here..."
                rows={12}
                type="textarea"
                value={original}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <FieldForm
                label="Modified"
                name="modified"
                onChange={handleModifiedChange}
                placeholder="Paste modified text here..."
                rows={12}
                type="textarea"
                value={modified}
              />
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-900" />

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-body-sm font-medium text-gray-400">Diff Output</span>
              {unifiedDiff && <CopyButton label="diff" value={unifiedDiff} />}
            </div>
            <div
              aria-label="Diff output"
              className="overflow-auto rounded-lg border border-gray-800 bg-gray-950 font-mono text-sm"
              role="region"
            >
              {rows.length > 0 ? (
                <>
                  <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-gray-800 bg-gray-950">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500">Original</div>
                    <div className="border-l border-gray-800 px-3 py-1.5 text-xs font-medium text-gray-500">
                      Modified
                    </div>
                  </div>
                  <div className="grid grid-cols-2">
                    {rows.map((row, i) => (
                      <div className="col-span-2 grid grid-cols-subgrid" key={i}>
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

          {error != null && (
            <p className="text-error text-body-sm shrink-0" role="alert">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
