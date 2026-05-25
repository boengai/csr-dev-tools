import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import { ErrorBanner, Pane, SplitPanel, UploadInput } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { useSortableItems, useToolComputation } from '@/hooks'
import type { BytesPdfResult, SortablePdfShellProps } from '@/types'

import { DownloadPdfButton } from './DownloadPdfButton'
import { PdfBytesPreview } from './PdfBytesPreview'

// `BytesPdfResult`'s empty shape is paired with `isEmpty: items.length === 0`
// below. Both must move together — either side alone would flash stale output
// during the empty-bypass window. See CONTEXT.md → "Sortable PDF shell".
const EMPTY_RESULT: BytesPdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }

export const SortablePdfShell = <TItem extends { id: string }, TExtras extends object = Record<string, never>>({
  accept,
  autoOpen,
  compute,
  description,
  extensionRe,
  filenameSlug,
  initialExtras,
  onAcceptedFiles,
  onAfterDialogClose,
  onReset,
  renderCard,
  renderControls,
  renderExtraCards,
  title,
  triggers,
  uploadButtonLabel,
  uploadInputName,
}: SortablePdfShellProps<TItem, TExtras>) => {
  const {
    addItems,
    dndContextProps,
    items,
    rejectFiles,
    removeItem,
    reset: resetItems,
    skipped,
    sortableContextProps,
    updateItem,
  } = useSortableItems<TItem>()

  // Stabilised with useRef so handleReset's deps don't re-fire on every render.
  const defaultExtrasRef = useRef<TExtras>((initialExtras ?? ({} as TExtras)) as TExtras)
  const [extras, setExtrasState] = useState<TExtras>(defaultExtrasRef.current)

  const setExtras = useCallback((partial: Partial<TExtras>) => {
    setExtrasState((prev) => ({ ...prev, ...partial }))
  }, [])

  // No error handler is passed — the pipeline populates `error` without
  // toasting. The shell renders the inline banner. Mirrors MarkupToPdfShell's
  // discipline (banner replaces toast — see CONTEXT.md → "Toast channel").
  const { error, result, setInput } = useToolComputation<{ items: Array<TItem>; extras: TExtras }, BytesPdfResult>(
    (input) => compute(input.items, input.extras),
    {
      debounceMs: 150,
      initial: EMPTY_RESULT,
      isEmpty: (input) => input.items.length === 0,
    },
  )

  // Pipeline input is rebuilt per change from internal `items` + Tool-owned
  // `extras` — the shell uses the unwrapped `useToolComputation` per the
  // doctrine for shells that bridge state on every call. See CONTEXT.md →
  // "Tool input".
  useEffect(() => {
    setInput({ items, extras })
  }, [items, extras, setInput])

  const handleUpload = useCallback(
    (files: Array<File>) => {
      const accepted: Array<File> = []
      const skippedNames: Array<string> = []
      for (const file of files) {
        if (extensionRe.test(file.name)) accepted.push(file)
        else skippedNames.push(file.name)
      }
      if (skippedNames.length > 0) rejectFiles(skippedNames)
      if (accepted.length > 0) onAcceptedFiles(accepted, { addItems, rejectFiles })
    },
    [extensionRe, addItems, rejectFiles, onAcceptedFiles],
  )

  const handleReset = useCallback(() => {
    resetItems()
    setExtrasState(defaultExtrasRef.current)
    onReset?.()
  }, [resetItems, onReset])

  // Stale output is suppressed on error: when `error != null`, the shell hides
  // both <PdfBytesPreview> and <DownloadPdfButton> and surfaces err.message in
  // an inline banner. Prevents downloading bytes that don't match the displayed
  // source. See CONTEXT.md → "Sortable PDF shell" invariant 3.
  const hasError = error !== null
  const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'

  // Both download and preview are gated on non-empty bytes. renderControls is
  // gated on !hasError (suppressed during pipeline error so the inline banner
  // has the full pane) but NOT gated on hasResult — callers receive the slot
  // even before any items are added (e.g. to reflect stats or options).
  const hasResult = result.pdf.byteLength > 0

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={description}
      onAfterClose={onAfterDialogClose}
      onReset={handleReset}
      title={title}
      triggers={triggers}
    >
      <div className="flex min-h-0 w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <UploadInput
              accept={accept}
              aria-label={uploadButtonLabel}
              button={{ block: true, children: uploadButtonLabel }}
              multiple
              name={uploadInputName}
              onChange={handleUpload}
            />

            {skipped.length > 0 && (
              <ErrorBanner variant="warning">
                Skipped {skipped.length} unsupported file{skipped.length === 1 ? '' : 's'}: {skipped.join(', ')}
              </ErrorBanner>
            )}

            {(items.length > 0 || renderExtraCards) && (
              <DndContext {...dndContextProps}>
                <SortableContext {...sortableContextProps}>
                  <div className="flex flex-wrap gap-3">
                    {items.map((item, idx) => (
                      <Fragment key={item.id}>
                        {renderCard(item, {
                          position: idx + 1,
                          onRemove: () => removeItem(item.id),
                          update: (partial) => updateItem(item.id, partial),
                        })}
                      </Fragment>
                    ))}
                    {renderExtraCards?.()}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Pane>

          <Pane live>
            {hasError ? (
              <ErrorBanner variant="warning">{errorMessage}</ErrorBanner>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">{renderControls?.({ extras, setExtras, result })}</div>
                  {hasResult && (
                    <DownloadPdfButton
                      bytes={result.pdf}
                      filename={`csr-dev-tools_${filenameSlug}_${Date.now()}.pdf`}
                    />
                  )}
                </div>
                {hasResult && <PdfBytesPreview bytes={result.pdf} />}
              </>
            )}
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
