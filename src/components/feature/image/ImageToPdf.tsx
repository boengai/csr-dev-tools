import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useRef, useState } from 'react'

import { CheckboxInput, ErrorBanner, Pane, SplitPanel, UploadInput } from '@/components/common'
import { DownloadPdfButton, PdfBytesPreview } from '@/components/common/pdf'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { formatFileSize, imagesToPdf, type ImageToPdfInput, type ImageToPdfResult } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-to-pdf']

type ImageItem = {
  id: string
  file: File
  rotation: 0 | 90 | 180 | 270
}

const EMPTY_RESULT: ImageToPdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }

const ALLOWED_RE = /\.(png|jpe?g)$/i

// ─── ImageCard ────────────────────────────────────────────────────────────────

type ImageCardProps = {
  item: ImageItem
  pageNumber: number
  onRemove: () => void
  onRotate: () => void
}

const ImageCard = ({ item, pageNumber, onRemove, onRotate }: ImageCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const thumbnailUrl = useBlobUrl(item.file)

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
        {thumbnailUrl && (
          <img
            alt={item.file.name}
            className="h-full w-full object-cover"
            src={thumbnailUrl}
            style={{ transform: `rotate(${item.rotation}deg)` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-1 text-body-xs">
        <span className="truncate text-gray-300" title={item.file.name}>
          {item.file.name}
        </span>
      </div>
      <div className="flex items-center justify-between text-body-xs text-gray-500">
        <span>Page {pageNumber}</span>
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
      {/* raw button: absolute-positioned 24×24 hover-only circle; Button always shows children with min-h-8 */}
      <button
        aria-label={`Rotate ${item.file.name}`}
        className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gray-800 text-gray-300 opacity-0 transition-opacity hover:bg-blue-600 hover:text-white group-hover:opacity-100"
        onClick={onRotate}
        title={`Rotation: ${item.rotation}°`}
        type="button"
      >
        ↻
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const ImageToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [items, setItems] = useState<Array<ImageItem>>([])
  const [skipped, setSkipped] = useState<Array<string>>([])
  const [result, setResult] = useState<ImageToPdfResult>(EMPTY_RESULT)
  const [onePerPage, setOnePerPage] = useState(true)
  const debounceRef = useRef<number | undefined>(undefined)

  // Regenerate the PDF whenever items or layout option changes (debounced ~150ms)
  useEffect(() => {
    if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    if (items.length === 0) {
      setResult(EMPTY_RESULT)
      return
    }
    debounceRef.current = window.setTimeout(async () => {
      const inputs: Array<ImageToPdfInput> = items.map((i) => ({ file: i.file, rotation: i.rotation }))
      const out = await imagesToPdf(inputs, { layout: onePerPage ? 'one-per-page' : 'grid-2x2' })
      setResult(out)
    }, 150)
    return () => {
      if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    }
  }, [items, onePerPage])

  const addFiles = useCallback((files: Array<File>) => {
    const accepted: Array<ImageItem> = []
    const skippedNames: Array<string> = []
    for (const file of files) {
      if (ALLOWED_RE.test(file.name)) {
        accepted.push({
          id: crypto.randomUUID(),
          file,
          rotation: 0,
        })
      } else {
        skippedNames.push(file.name)
      }
    }
    setItems((prev) => [...prev, ...accepted])
    setSkipped(skippedNames)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const rotateItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const next: 0 | 90 | 180 | 270 = i.rotation === 0 ? 90 : i.rotation === 90 ? 180 : i.rotation === 180 ? 270 : 0
        return { ...i, rotation: next }
      }),
    )
  }, [])

  const reset = useCallback(() => {
    setItems([])
    setSkipped([])
    setResult(EMPTY_RESULT)
    setOnePerPage(true)
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
      title="Image to PDF"
      triggers={[{ label: 'Convert' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <SplitPanel>
          <Pane>
            <UploadInput
              accept="image/png,image/jpeg"
              button={{ block: true, children: 'Select PNG or JPEG images' }}
              multiple
              name="image-to-pdf-source"
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
                      <ImageCard
                        item={item}
                        key={item.id}
                        onRemove={() => removeItem(item.id)}
                        onRotate={() => rotateItem(item.id)}
                        pageNumber={idx + 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Pane>

          <Pane live>
            <div className="flex items-center justify-between gap-2">
              <label
                className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-300"
                htmlFor="image-to-pdf-one-per-page"
              >
                <CheckboxInput
                  checked={onePerPage}
                  id="image-to-pdf-one-per-page"
                  name="image-to-pdf-one-per-page"
                  onChange={(c) => setOnePerPage(c === true)}
                />
                1 image per page
              </label>
              <DownloadPdfButton bytes={result.pdf} filename="images.pdf" />
            </div>
            <PdfBytesPreview bytes={result.pdf} />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
