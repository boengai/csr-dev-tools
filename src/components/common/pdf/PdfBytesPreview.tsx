import { useEffect, useState } from 'react'

import type { PdfBytesPreviewProps, PdfBytesPreviewRendered } from '@/types'

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

/** Loads pdf.js + wires its worker once; concurrent callers (StrictMode's double effect) share one import. */
const loadPdfjs = (): Promise<typeof import('pdfjs-dist')> => {
  if (pdfjsPromise) return pdfjsPromise
  pdfjsPromise = (async () => {
    const [pdfjsLib, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default
    return pdfjsLib
  })()
  // Allow a retry after a failed chunk load.
  pdfjsPromise.catch(() => {
    pdfjsPromise = null
  })
  return pdfjsPromise
}

export const PdfBytesPreview = ({ bytes }: PdfBytesPreviewProps) => {
  // State is only written from the async render below, tagged with the buffer
  // it belongs to. `isRendering` derives from a mismatch, so the effect never
  // sets state synchronously and StrictMode's mount→cleanup→mount simply
  // cancels the first run and lets the second one finish.
  const [rendered, setRendered] = useState<PdfBytesPreviewRendered | null>(null)

  useEffect(() => {
    if (bytes.byteLength === 0) return
    let cancelled = false
    let loadingTask: { destroy: () => Promise<void> } | null = null

    ;(async () => {
      try {
        const pdfjsLib = await loadPdfjs()
        if (cancelled) return

        const task = pdfjsLib.getDocument({ data: bytes.slice() })
        loadingTask = task
        const doc = await task.promise
        const out: Array<string> = []

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale: 0.6 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvas, viewport }).promise
          out.push(canvas.toDataURL('image/png'))
        }

        if (!cancelled) setRendered({ bytes, error: null, pages: out })
      } catch (e) {
        if (!cancelled) {
          setRendered({ bytes, error: e instanceof Error ? e.message : 'Failed to render preview', pages: [] })
        }
      } finally {
        // Frees the worker-side document and its page caches.
        void loadingTask?.destroy()
      }
    })()

    return () => {
      cancelled = true
      void loadingTask?.destroy()
    }
  }, [bytes])

  if (bytes.byteLength === 0) return null

  const isRendering = rendered?.bytes !== bytes
  // While a new buffer renders, keep showing the previous pages (no flash).
  const pages = rendered?.pages ?? []
  const error = isRendering ? null : rendered.error

  return (
    <div className="flex min-h-0 grow flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-body-xs font-medium text-gray-300">PDF preview</span>
        {isRendering && <span className="text-body-xs text-gray-500">Rendering…</span>}
      </div>
      {error !== null && (
        <p className="text-red-400 text-body-xs" role="alert">
          {error}
        </p>
      )}
      <div className="flex min-h-0 grow flex-col gap-3 overflow-auto rounded-lg border-2 border-gray-900 bg-gray-100 p-3">
        {pages.map((dataUrl, i) => (
          // Page number is the page's identity — the list is rebuilt wholesale per buffer.
          <img
            alt={`Page ${i + 1}`}
            className="mx-auto block w-full max-w-[400px] rounded shadow-md"
            key={`page-${i + 1}`}
            src={dataUrl}
          />
        ))}
      </div>
    </div>
  )
}
