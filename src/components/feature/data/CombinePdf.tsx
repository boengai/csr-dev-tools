import { useCallback, useState } from 'react'

import { SortableCard } from '@/components/common'
import { SortablePdfShell } from '@/components/common/pdf'
import { TOOL_REGISTRY_MAP } from '@/constants'
import type { ToolComponentProps } from '@/types'
import { combinePdfPages, readPdfPages } from '@/utils/combine-pdf'

const toolEntry = TOOL_REGISTRY_MAP['combine-pdf']

type PageItem = {
  id: string
  file: File
  sourceFileName: string
  sourcePageIndex: number
  thumbnailUrl: string
}

type LoadingFile = {
  id: string
  fileName: string
}

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

// ─── EmptyHint ───────────────────────────────────────────────────────────────

const EmptyHint = () => (
  <div className="flex grow flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-800 p-8 text-center text-body-xs text-gray-500">
    <p className="text-body-sm text-gray-300">No PDFs added yet</p>
    <p>Use "Select PDF files" above to add one or more.</p>
    <p>Each page becomes a draggable card you can re-order before downloading the combined result.</p>
  </div>
)

// ─── Main component ──────────────────────────────────────────────────────────

export const CombinePdf = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const [loading, setLoading] = useState<Array<LoadingFile>>([])

  const handleReset = useCallback(() => setLoading([]), [])

  const onAcceptedFiles = useCallback(
    (
      files: Array<File>,
      helpers: {
        addItems: (items: Array<PageItem>) => void
        rejectFiles: (next: Array<string> | ((prev: Array<string>) => Array<string>)) => void
      },
    ) => {
      const loadingEntries: Array<LoadingFile> = files.map((f) => ({
        id: crypto.randomUUID(),
        fileName: f.name,
      }))
      setLoading((prev) => [...prev, ...loadingEntries])

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const loadingId = loadingEntries[i].id

        void (async () => {
          const pages = await readPdfPages(file)
          if (pages === null) {
            // The functional form preserves the previous skipped list and
            // dedupes — these inner-async failures must accumulate against any
            // names already rejected by the shell's extension filter.
            helpers.rejectFiles((prev) => (prev.includes(file.name) ? prev : [...prev, file.name]))
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
          helpers.addItems(newItems)
          setLoading((prev) => prev.filter((l) => l.id !== loadingId))
        })()
      }
    },
    [],
  )

  return (
    <SortablePdfShell<PageItem>
      accept="application/pdf"
      autoOpen={autoOpen}
      compute={(items) => combinePdfPages(items.map((i) => ({ file: i.file, pageIndex: i.sourcePageIndex })))}
      description={toolEntry?.description}
      extensionRe={/\.pdf$/i}
      filenameSlug="combined"
      onAcceptedFiles={onAcceptedFiles}
      onAfterClose={onAfterClose}
      onReset={handleReset}
      renderCard={(item, { position, onRemove }) => <PageCard item={item} onRemove={onRemove} position={position} />}
      renderEmptyState={() => <EmptyHint />}
      renderExtraCards={() => loading.map((l) => <LoadingCard fileName={l.fileName} key={l.id} />)}
      title="Combine PDF"
      triggers={[{ label: 'Combine' }]}
      uploadButtonLabel="Select PDF files"
      uploadInputName="combine-pdf-source"
    />
  )
}
