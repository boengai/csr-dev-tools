import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { useCallback, useEffect, useState } from 'react'

import { CheckboxInput, ErrorBanner, Pane, SortableCard, SplitPanel, UploadInput } from '@/components/common'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { DownloadPdfButton, PdfBytesPreview } from '@/components/common/pdf'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl, useSortableItems, useToolComputation } from '@/hooks'
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
  const thumbnailUrl = useBlobUrl(item.file)

  return (
    <SortableCard id={item.id} onRemove={onRemove} removeLabel={`Remove ${item.file.name}`}>
      <SortableCard.Handle>
        {thumbnailUrl && (
          <img
            alt={item.file.name}
            className="h-full w-full object-cover"
            src={thumbnailUrl}
            style={{ transform: `rotate(${item.rotation}deg)` }}
          />
        )}
      </SortableCard.Handle>
      <div className="flex items-center justify-between gap-1 text-body-xs">
        <span className="truncate text-gray-300" title={item.file.name}>
          {item.file.name}
        </span>
      </div>
      <div className="flex items-center justify-between text-body-xs text-gray-500">
        <span>Page {pageNumber}</span>
        <span>{formatFileSize(item.file.size)}</span>
      </div>
      {/* raw button: absolute-positioned 24×24 hover-only circle; the common
          <Button> always shows children with min-h-8 chrome. Sibling of
          <SortableCard.Handle> per CONTEXT.md → SortableCard. */}
      <button
        aria-label={`Rotate ${item.file.name}`}
        className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gray-800 text-gray-300 opacity-0 transition-opacity hover:bg-blue-600 hover:text-white group-hover:opacity-100"
        onClick={onRotate}
        title={`Rotation: ${item.rotation}°`}
        type="button"
      >
        ↻
      </button>
    </SortableCard>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const ImageToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
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
  } = useSortableItems<ImageItem>()
  const [onePerPage, setOnePerPage] = useState(true)

  const { result, setInput } = useToolComputation<
    { items: Array<ImageItem>; onePerPage: boolean },
    ImageToPdfResult
  >(
    (input) => {
      const inputs: Array<ImageToPdfInput> = input.items.map((i) => ({ file: i.file, rotation: i.rotation }))
      return imagesToPdf(inputs, { layout: input.onePerPage ? 'one-per-page' : 'grid-2x2' })
    },
    {
      debounceMs: 150,
      errorLabel: 'Failed to generate PDF',
      initial: EMPTY_RESULT,
      isEmpty: (input) => input.items.length === 0,
    },
  )

  // Pipeline input is rebuilt per change from external React state (seam's
  // `items` + Tool-owned `onePerPage`), so this Tool uses the unwrapped
  // `useToolComputation` per the doctrine — see CONTEXT.md → "Tool input".
  useEffect(() => {
    setInput({ items, onePerPage })
  }, [items, onePerPage, setInput])

  const addFiles = useCallback(
    (files: Array<File>) => {
      const accepted: Array<ImageItem> = []
      const skippedNames: Array<string> = []
      for (const file of files) {
        if (ALLOWED_RE.test(file.name)) {
          accepted.push({ id: crypto.randomUUID(), file, rotation: 0 })
        } else {
          skippedNames.push(file.name)
        }
      }
      if (accepted.length > 0) addItems(accepted)
      rejectFiles(skippedNames)
    },
    [addItems, rejectFiles],
  )

  const rotateItem = useCallback(
    (id: string) => {
      const current = items.find((i) => i.id === id)
      if (!current) return
      const next: 0 | 90 | 180 | 270 =
        current.rotation === 0 ? 90 : current.rotation === 90 ? 180 : current.rotation === 180 ? 270 : 0
      updateItem(id, { rotation: next })
    },
    [items, updateItem],
  )

  const reset = useCallback(() => {
    resetItems()
    setOnePerPage(true)
    // `result` resets via the mirror effect: items becomes [], the pipeline's
    // isEmpty short-circuits to `initial` synchronously inside the same tick.
  }, [resetItems])

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="Image to PDF"
      triggers={[{ label: 'Convert' }]}
    >
      <div className="flex min-h-0 w-full grow flex-col gap-4">
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
              <DndContext {...dndContextProps}>
                <SortableContext {...sortableContextProps}>
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
              <DownloadPdfButton bytes={result.pdf} filename={`csr-dev-tools_images_${Date.now()}.pdf`} />
            </div>
            <PdfBytesPreview bytes={result.pdf} />
          </Pane>
        </SplitPanel>
      </div>
    </ToolDialogFrame>
  )
}
