import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { imagesToPdf, type ImageToPdfInput, type ImageToPdfResult } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-to-pdf']

type ImageItem = {
  id: string
  file: File
  thumbnailUrl: string
  rotation: 0 | 90 | 180 | 270
}

const EMPTY_RESULT: ImageToPdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }

const ALLOWED_RE = /\.(png|jpe?g)$/i

// ─── Utilities ───────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Dropzone ────────────────────────────────────────────────────────────────

type DropzoneProps = {
  onFiles: (files: Array<File>) => void
  compact: boolean
}

const Dropzone = ({ onFiles, compact }: DropzoneProps) => {
  const [isOver, setIsOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    const files = Array.from(e.dataTransfer.files)
    onFiles(files)
  }

  return (
    <div
      className={`grid place-items-center rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
        isOver ? 'border-blue-500 bg-blue-950' : 'border-gray-700 bg-gray-950 hover:border-gray-500'
      } ${compact ? 'min-h-[80px] p-3' : 'min-h-[180px] p-6'}`}
      onClick={() => inputRef.current?.click()}
      onDragLeave={() => setIsOver(false)}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true) }}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-2xl">📥</span>
        <span className="text-body-sm font-medium text-gray-200">
          Drop images here or click to choose
        </span>
        <span className="text-body-xs text-gray-500">PNG · JPEG</span>
      </div>
      <input
        accept="image/png,image/jpeg"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files) onFiles(Array.from(e.target.files))
          e.target.value = ''
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  )
}

// ─── ImageCard ────────────────────────────────────────────────────────────────

type ImageCardProps = {
  item: ImageItem
  pageNumber: number
  onRemove: () => void
  onRotate: () => void
}

const ImageCard = ({ item, pageNumber, onRemove, onRotate }: ImageCardProps) => {
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
        <img
          alt={item.file.name}
          className="h-full w-full object-cover"
          src={item.thumbnailUrl}
          style={{ transform: `rotate(${item.rotation}deg)` }}
        />
      </div>
      <div className="flex items-center justify-between gap-1 text-body-xs">
        <span className="truncate text-gray-300" title={item.file.name}>
          {item.file.name}
        </span>
      </div>
      <div className="flex items-center justify-between text-body-xs text-gray-500">
        <span>Page {pageNumber}</span>
        <span>{formatBytes(item.file.size)}</span>
      </div>
      <button
        aria-label={`Remove ${item.file.name}`}
        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gray-800 text-gray-300 opacity-0 transition-opacity hover:bg-red-600 hover:text-white group-hover:opacity-100"
        onClick={onRemove}
        type="button"
      >
        ×
      </button>
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

// ─── SummaryBar ───────────────────────────────────────────────────────────────

type SummaryBarProps = {
  itemCount: number
  pdfBytes: Uint8Array
  isBusy: boolean
}

const SummaryBar = ({ itemCount, pdfBytes, isBusy }: SummaryBarProps) => {
  const blob = pdfBytes.byteLength === 0 ? null : new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
  const href = useBlobUrl(blob)

  if (itemCount === 0) return null

  return (
    <div className="flex items-center justify-between rounded-lg border-2 border-gray-900 bg-gray-950 p-4">
      <span className="text-body-sm text-gray-300">
        {itemCount} image{itemCount === 1 ? '' : 's'} → 1 PDF ({formatBytes(pdfBytes.byteLength)})
      </span>
      {isBusy ? (
        <span className="text-body-xs text-gray-500">Generating…</span>
      ) : href === null ? (
        <button className="rounded-md bg-gray-800 px-4 py-2 text-body-sm font-medium text-gray-500" disabled type="button">
          Download PDF
        </button>
      ) : (
        <a className="rounded-md bg-blue-600 px-4 py-2 text-body-sm font-medium text-white hover:bg-blue-500" download="images.pdf" href={href}>
          Download PDF
        </a>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const ImageToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [items, setItems] = useState<Array<ImageItem>>([])
  const [skipped, setSkipped] = useState<Array<string>>([])
  const [result, setResult] = useState<ImageToPdfResult>(EMPTY_RESULT)
  const [isBusy, setIsBusy] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)
  // Keep a ref in sync so the unmount cleanup can read the latest items
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Regenerate the PDF whenever items change (debounced ~150ms)
  useEffect(() => {
    if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    if (items.length === 0) {
      setResult(EMPTY_RESULT)
      return
    }
    setIsBusy(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const inputs: Array<ImageToPdfInput> = items.map((i) => ({ file: i.file, rotation: i.rotation }))
        const out = await imagesToPdf(inputs)
        setResult(out)
      } finally {
        setIsBusy(false)
      }
    }, 150)
    return () => {
      if (debounceRef.current !== undefined) window.clearTimeout(debounceRef.current)
    }
  }, [items])

  // Revoke all thumbnail URLs on unmount — read itemsRef so closure captures latest state
  useEffect(() => {
    return () => {
      for (const i of itemsRef.current) URL.revokeObjectURL(i.thumbnailUrl)
    }
  }, [])

  const addFiles = useCallback((files: Array<File>) => {
    const accepted: Array<ImageItem> = []
    const skippedNames: Array<string> = []
    for (const file of files) {
      if (ALLOWED_RE.test(file.name)) {
        accepted.push({
          id: crypto.randomUUID(),
          file,
          thumbnailUrl: URL.createObjectURL(file),
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
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item) URL.revokeObjectURL(item.thumbnailUrl)
      return prev.filter((i) => i.id !== id)
    })
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
    for (const i of items) URL.revokeObjectURL(i.thumbnailUrl)
    setItems([])
    setSkipped([])
    setResult(EMPTY_RESULT)
  }, [items])

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
        <Dropzone compact={items.length > 0} onFiles={addFiles} />

        {skipped.length > 0 && (
          <p className="text-body-xs text-yellow-400" role="alert">
            Skipped {skipped.length} unsupported file{skipped.length === 1 ? '' : 's'}: {skipped.join(', ')}
          </p>
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

        <SummaryBar isBusy={isBusy} itemCount={items.length} pdfBytes={result.pdf} />
      </div>
    </ToolDialogFrame>
  )
}
