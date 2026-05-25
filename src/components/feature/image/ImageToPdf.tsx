import { CheckboxInput, SortableCard } from '@/components/common'
import { SortablePdfShell } from '@/components/common/pdf'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { formatFileSize, imagesToPdf, type ImageToPdfInput } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-to-pdf']

type ImageItem = {
  id: string
  file: File
  rotation: 0 | 90 | 180 | 270
}

type Extras = { onePerPage: boolean }

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
      {/* raw button: absolute-positioned 24×24 hover-only circle; sibling of
          <SortableCard.Handle> per CONTEXT.md → SortableCard. */}
      <button
        aria-label={`Rotate ${item.file.name}`}
        className="hover:bg-blue-600 absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full bg-gray-800 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
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

export const ImageToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => (
  <SortablePdfShell<ImageItem, Extras>
    accept="image/png,image/jpeg"
    autoOpen={autoOpen}
    compute={async (items, { onePerPage }) =>
      imagesToPdf(
        items.map((i): ImageToPdfInput => ({ file: i.file, rotation: i.rotation })),
        { layout: onePerPage ? 'one-per-page' : 'grid-2x2' },
      )
    }
    description={toolEntry?.description}
    extensionRe={/\.(png|jpe?g)$/i}
    filenameSlug="images"
    initialExtras={{ onePerPage: true }}
    onAcceptedFiles={(files, { addItems }) => {
      addItems(files.map((file): ImageItem => ({ id: crypto.randomUUID(), file, rotation: 0 })))
    }}
    onAfterDialogClose={onAfterDialogClose}
    renderCard={(item, { position, onRemove, update }) => (
      <ImageCard
        item={item}
        onRemove={onRemove}
        onRotate={() => {
          const next: 0 | 90 | 180 | 270 =
            item.rotation === 0 ? 90 : item.rotation === 90 ? 180 : item.rotation === 180 ? 270 : 0
          update({ rotation: next })
        }}
        pageNumber={position}
      />
    )}
    renderControls={({ extras, setExtras }) => (
      <label
        className="flex cursor-pointer items-center gap-2 text-body-xs text-gray-300"
        htmlFor="image-to-pdf-one-per-page"
      >
        <CheckboxInput
          checked={extras.onePerPage}
          id="image-to-pdf-one-per-page"
          name="image-to-pdf-one-per-page"
          onChange={(c) => setExtras({ onePerPage: c === true })}
        />
        1 image per page
      </label>
    )}
    title="Image to PDF"
    triggers={[{ label: 'Convert' }]}
    uploadButtonLabel="Select PNG or JPEG images"
    uploadInputName="image-to-pdf-source"
  />
)
