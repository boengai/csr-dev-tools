import { useEffect, useRef, useState } from 'react'

type PdfBytesPreviewProps = { bytes: Uint8Array }

export const PdfBytesPreview = ({ bytes }: PdfBytesPreviewProps) => {
  const [pages, setPages] = useState<Array<string>>([])
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Track the last rendered buffer by reference so we don't re-render
  // when the parent re-renders but result.pdf is the same object.
  const lastBytesRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    // Skip if it's the exact same buffer reference — avoids infinite loops
    // when sibling state changes (e.g. isRendering) cause parent re-renders.
    if (bytes === lastBytesRef.current) return

    lastBytesRef.current = bytes

    if (bytes.byteLength === 0) {
      setPages([])
      return
    }
    let cancelled = false
    setIsRendering(true)
    setError(null)

    ;(async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

        const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() })
        const doc = await loadingTask.promise
        const out: Array<string> = []

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) break
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale: 0.6 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvas, viewport }).promise
          out.push(canvas.toDataURL('image/png'))
        }

        if (!cancelled) setPages(out)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to render preview')
        }
      } finally {
        if (!cancelled) setIsRendering(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [bytes])

  if (bytes.byteLength === 0) return null

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
          <img
            alt={`Page ${i + 1}`}
            className="mx-auto block w-full max-w-[400px] rounded shadow-md"
            key={i}
            src={dataUrl}
          />
        ))}
      </div>
    </div>
  )
}
