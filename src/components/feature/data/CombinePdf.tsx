import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ErrorBanner, Pane, SplitPanel, UploadInput } from '@/components/common'
import { DownloadPdfButton, PdfBytesPreview } from '@/components/common/pdf'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { combinePdfs, type CombinePdfResult, formatFileSize, readPdfMeta } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['combine-pdf']

type PdfItem = {
  id: string
  file: File
  pageCount: number | null
  thumbnailUrl: string | null
}

const EMPTY_RESULT: CombinePdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }
const ALLOWED_RE = /\.pdf$/i

// ─── PdfCard ─────────────────────────────────────────────────────────────────

type PdfCardProps = {
  item: PdfItem
  position: number
  onRemove: () => void
}

const PdfCard = ({ item, position, onRemove }: PdfCardProps) => {
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
    >
      <div
        className="aspect-square cursor-grab overflow-hidden rounded bg-gray-900"
        {...attributes}
        {...listeners}
      >
        {item.thumbnailUrl ? (
          <img alt={`${item.file.name} preview`} className="h-full w-full object-contain" src={item.thumbnailUrl} />
        ) : (
          <div className="grid h-full w-full place-items-center text-body-xs text-gray-500">PDF</div>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 text-body-xs">
        <span className="truncate text-gray-300" title={item.file.name}>
          {item.file.name}
        </span>
      </div>
      <div className="flex items-center justify-between text-body-xs text-gray-500">
        <span>
          #{position} · {item.pageCount === null ? '…' : `${item.pageCount}p`}
        </span>
        <span>{formatFileSize(item.file.size)}</span>
      </div>
      {/* raw button: absolute-positioned 24×24 hover-only circle; Button always shows children with min-h-8 */}
      <button
        aria-label={`Remove ${item.file.name}`}
        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gray-800 text-gray-300 opacity-0 transition-opacity hover:bg-red-600 hover:text-white group-hover:opacity-100"
        onClick={onRemove}
        type="button"
      >
        ×
      </button>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export const CombinePdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [items, setItems] = useState<Array<PdfItem>>([])
  const [skipped, setSkipped] = useState<Array<string>>([])
  const [result, setResult] = useState<CombinePdfResult>(EMPTY_RESULT)
  const debounceRef = useRef<number | undefined>(undefined)

  // Regenerate the merged PDF whenever items change (debounced ~200ms — PDF parsing is heavier than images)
  useEffect(() => {
    if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    if (items.length === 0) {
      setResult(EMPTY_RESULT)
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      const out = await combinePdfs(items.map((i) => ({ file: i.file })))
      setResult(out)
    }, 200)
    return () => {
      if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    }
  }, [items])

  const addFiles = useCallback((files: Array<File>) => {
    const accepted: Array<PdfItem> = []
    const skippedNames: Array<string> = []
    for (const file of files) {
      if (ALLOWED_RE.test(file.name)) {
        accepted.push({
          id: crypto.randomUUID(),
          file,
          pageCount: null,
          thumbnailUrl: null,
        })
      } else {
        skippedNames.push(file.name)
      }
    }
    setItems((prev) => [...prev, ...accepted])
    setSkipped(skippedNames)

    // Kick off async meta read for each new item; update its pageCount + thumbnail when ready.
    for (const newItem of accepted) {
      void (async () => {
        const meta = await readPdfMeta(newItem.file)
        if (meta) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === newItem.id ? { ...i, pageCount: meta.pageCount, thumbnailUrl: meta.thumbnailUrl } : i,
            ),
          )
        }
      })()
    }
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const reset = useCallback(() => {
    setItems([])
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

            {items.length > 0 && (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                  <div className="flex flex-wrap gap-3">
                    {items.map((item, idx) => (
                      <PdfCard item={item} key={item.id} onRemove={() => removeItem(item.id)} position={idx + 1} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Pane>

          <Pane live>
            <div className="flex items-center justify-end">
              <DownloadPdfButton bytes={result.pdf} filename="combined.pdf" />
            </div>
            <PdfBytesPreview bytes={result.pdf} />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
