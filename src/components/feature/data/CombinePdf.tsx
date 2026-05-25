import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { useCallback, useEffect, useState } from 'react'

import { ErrorBanner, Pane, SortableCard, SplitPanel, UploadInput } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { DownloadPdfButton, PdfBytesPreview } from '@/components/common/pdf'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useSortableItems, useToolComputation } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { combinePdfPages, type CombinePdfResult, readPdfPages } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['combine-pdf']

type PageItem = {
  id: string // unique per item; identifies the card across drags
  file: File // source file reference
  sourceFileName: string // display
  sourcePageIndex: number // 0-based index within the source PDF
  thumbnailUrl: string // rendered preview
}

type LoadingFile = {
  id: string // a placeholder card id; replaced once pages render
  fileName: string
}

const EMPTY_RESULT: CombinePdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }
const ALLOWED_RE = /\.pdf$/i

// ─── PageCard ────────────────────────────────────────────────────────────────

type PageCardProps = {
  item: PageItem
  position: number
  onRemove: () => void
}

const PageCard = ({ item, position, onRemove }: PageCardProps) => (
  <SortableCard
    id={item.id}
    onRemove={onRemove}
    removeLabel={`Remove ${item.sourceFileName} page ${item.sourcePageIndex + 1}`}
  >
    <SortableCard.Handle>
      <img
        alt={`${item.sourceFileName} page ${item.sourcePageIndex + 1}`}
        className="h-full w-full object-contain"
        src={item.thumbnailUrl}
      />
    </SortableCard.Handle>
    <div className="flex flex-col gap-0.5 text-body-xs">
      <span className="truncate text-gray-300" title={item.sourceFileName}>
        {item.sourceFileName}
      </span>
      <div className="flex items-center justify-between text-gray-500">
        <span>p{item.sourcePageIndex + 1}</span>
        <span>#{position}</span>
      </div>
    </div>
  </SortableCard>
)

// ─── LoadingCard ─────────────────────────────────────────────────────────────

const LoadingCard = ({ fileName }: { fileName: string }) => (
  <div className="flex w-32 flex-col items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2 text-body-xs text-gray-500">
    <div className="grid aspect-square w-full place-items-center bg-gray-900">…</div>
    <span className="truncate" title={fileName}>
      {fileName}
    </span>
    <span>Loading…</span>
  </div>
)

// ─── Main component ──────────────────────────────────────────────────────────

export const CombinePdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const {
    addItems,
    dndContextProps,
    items,
    rejectFiles,
    removeItem,
    reset: resetItems,
    skipped,
    sortableContextProps,
  } = useSortableItems<PageItem>()
  const [loading, setLoading] = useState<Array<LoadingFile>>([])

  const { result, setInput } = useToolComputation<Array<PageItem>, CombinePdfResult>(
    (input) => combinePdfPages(input.map((i) => ({ file: i.file, pageIndex: i.sourcePageIndex }))),
    {
      debounceMs: 200,
      errorLabel: 'Failed to merge PDFs',
      initial: EMPTY_RESULT,
      isEmpty: (input) => input.length === 0,
    },
  )

  // Pipeline input is rebuilt per change from external React state (seam's
  // `items`), so this Tool uses the unwrapped `useToolComputation` per the
  // doctrine — see CONTEXT.md → "Tool input".
  useEffect(() => {
    setInput(items)
  }, [items, setInput])

  const addFiles = useCallback(
    (files: Array<File>) => {
      const skippedNames: Array<string> = []
      const loadingEntries: Array<LoadingFile> = []
      for (const file of files) {
        if (!ALLOWED_RE.test(file.name)) {
          skippedNames.push(file.name)
          continue
        }
        loadingEntries.push({ id: crypto.randomUUID(), fileName: file.name })
      }
      rejectFiles(skippedNames)
      setLoading((prev) => [...prev, ...loadingEntries])

      // Render pages for each newly-accepted file
      const acceptedFiles = files.filter((f) => ALLOWED_RE.test(f.name))
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const loadingId = loadingEntries[i].id

        void (async () => {
          const pages = await readPdfPages(file)
          if (pages === null) {
            // The functional form preserves the previous skipped list and
            // dedupes — these inner-async failures must accumulate against
            // any names rejected by the initial extension filter.
            rejectFiles((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]))
            setLoading((prev) => prev.filter((l) => l.id !== loadingId))
            return
          }
          const newItems: Array<PageItem> = pages.map((p) => ({
            id: crypto.randomUUID(),
            file,
            sourceFileName: file.name,
            sourcePageIndex: p.pageIndex,
            thumbnailUrl: p.thumbnailUrl,
          }))
          addItems(newItems)
          setLoading((prev) => prev.filter((l) => l.id !== loadingId))
        })()
      }
    },
    [addItems, rejectFiles],
  )

  const reset = useCallback(() => {
    resetItems()
    setLoading([])
    // `result` resets via the mirror effect: items becomes [], the pipeline's
    // isEmpty short-circuits to `initial` synchronously inside the same tick.
  }, [resetItems])

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="Combine PDF"
      triggers={[{ label: 'Combine' }]}
    >
      <div className="flex min-h-0 w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <UploadInput
              accept="application/pdf"
              button={{ block: true, children: 'Select PDF files' }}
              multiple
              name="combine-pdf-source"
              onChange={addFiles}
            />

            {skipped.length > 0 && (
              <ErrorBanner variant="warning">
                Skipped {skipped.length} unsupported file{skipped.length === 1 ? '' : 's'}: {skipped.join(', ')}
              </ErrorBanner>
            )}

            {items.length === 0 && loading.length === 0 ? (
              <div className="flex grow flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-800 p-8 text-center text-body-xs text-gray-500">
                <p className="text-body-sm text-gray-300">No PDFs added yet</p>
                <p>Use "Select PDF files" above to add one or more.</p>
                <p>Each page becomes a draggable card you can re-order before downloading the combined result.</p>
              </div>
            ) : (
              <DndContext {...dndContextProps}>
                <SortableContext {...sortableContextProps}>
                  <div className="flex flex-wrap gap-3">
                    {items.map((item, idx) => (
                      <PageCard item={item} key={item.id} onRemove={() => removeItem(item.id)} position={idx + 1} />
                    ))}
                    {loading.map((l) => (
                      <LoadingCard fileName={l.fileName} key={l.id} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Pane>

          <Pane live>
            <div className="flex items-center justify-end">
              <DownloadPdfButton bytes={result.pdf} filename={`csr-dev-tools_combined_${Date.now()}.pdf`} />
            </div>
            <PdfBytesPreview bytes={result.pdf} />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
