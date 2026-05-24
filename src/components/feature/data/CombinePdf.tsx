import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ErrorBanner, Pane, SplitPanel, UploadInput } from '@/components/common'
import { DownloadPdfButton, PdfBytesPreview } from '@/components/common/pdf'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
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

const PageCard = ({ item, position, onRemove }: PageCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      className="group relative flex w-32 flex-col gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2"
      ref={setNodeRef}
      style={style}
      title={`${item.sourceFileName} · page ${item.sourcePageIndex + 1}`}
    >
      <div
        className="aspect-square cursor-grab overflow-hidden rounded bg-gray-900"
        {...attributes}
        {...listeners}
      >
        <img alt={`${item.sourceFileName} page ${item.sourcePageIndex + 1}`} className="h-full w-full object-contain" src={item.thumbnailUrl} />
      </div>
      <div className="flex flex-col gap-0.5 text-body-xs">
        <span className="truncate text-gray-300" title={item.sourceFileName}>
          {item.sourceFileName}
        </span>
        <div className="flex items-center justify-between text-gray-500">
          <span>p{item.sourcePageIndex + 1}</span>
          <span>#{position}</span>
        </div>
      </div>
      {/* raw button: absolute-positioned 24×24 hover-only circle; Button always shows children with min-h-8 */}
      <button
        aria-label={`Remove ${item.sourceFileName} page ${item.sourcePageIndex + 1}`}
        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gray-800 text-gray-300 opacity-0 transition-opacity hover:bg-red-600 hover:text-white group-hover:opacity-100"
        onClick={onRemove}
        type="button"
      >
        ×
      </button>
    </div>
  )
}

// ─── LoadingCard ─────────────────────────────────────────────────────────────

const LoadingCard = ({ fileName }: { fileName: string }) => (
  <div className="flex w-32 flex-col items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2 text-body-xs text-gray-500">
    <div className="aspect-square w-full grid place-items-center bg-gray-900">…</div>
    <span className="truncate" title={fileName}>{fileName}</span>
    <span>Loading…</span>
  </div>
)

// ─── Main component ──────────────────────────────────────────────────────────

export const CombinePdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [items, setItems] = useState<Array<PageItem>>([])
  const [loading, setLoading] = useState<Array<LoadingFile>>([])
  const [skipped, setSkipped] = useState<Array<string>>([])
  const [result, setResult] = useState<CombinePdfResult>(EMPTY_RESULT)
  const debounceRef = useRef<number | undefined>(undefined)

  // Regenerate the merged PDF whenever items change (debounced ~200ms)
  useEffect(() => {
    if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    if (items.length === 0) {
      setResult(EMPTY_RESULT)
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      const out = await combinePdfPages(items.map((i) => ({ file: i.file, pageIndex: i.sourcePageIndex })))
      setResult(out)
    }, 200)
    return () => {
      if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    }
  }, [items])

  const addFiles = useCallback((files: Array<File>) => {
    const skippedNames: Array<string> = []
    const loadingEntries: Array<LoadingFile> = []
    for (const file of files) {
      if (!ALLOWED_RE.test(file.name)) {
        skippedNames.push(file.name)
        continue
      }
      loadingEntries.push({ id: crypto.randomUUID(), fileName: file.name })
    }
    setSkipped(skippedNames)
    setLoading((prev) => [...prev, ...loadingEntries])

    // Render pages for each newly-accepted file
    const acceptedFiles = files.filter((f) => ALLOWED_RE.test(f.name))
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const loadingId = loadingEntries[i].id

      void (async () => {
        const pages = await readPdfPages(file)
        if (pages === null) {
          setSkipped((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]))
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
        setItems((prev) => [...prev, ...newItems])
        setLoading((prev) => prev.filter((l) => l.id !== loadingId))
      })()
    }
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const reset = useCallback(() => {
    setItems([])
    setLoading([])
    setSkipped([])
    setResult(EMPTY_RESULT)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === e.active.id)
        const newIndex = prev.findIndex((i) => i.id === e.over!.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

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
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
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
