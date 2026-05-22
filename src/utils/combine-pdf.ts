import { PDFDocument } from 'pdf-lib'

export type CombinePdfPageRef = {
  file: File
  pageIndex: number // 0-based
}

export type CombinePdfResult = {
  pdf: Uint8Array
  pageCount: number
  skipped: Array<string> // distinct filenames that failed to load
}

const EMPTY_RESULT: CombinePdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }

/**
 * Combine arbitrary pages from arbitrary PDFs into one PDF in the given order.
 * Each input ref names a source file + a 0-based page index. The same file may
 * appear multiple times with different page indices; this loads each file once
 * (cached by File reference) and copies pages in order. Files that fail to load
 * land in `skipped` (deduplicated).
 *
 * Known limitations:
 * - Many-page perf: rendering 100+ page thumbnails will be slow and memory-heavy.
 *   Acceptable for typical use (combining a few small PDFs); no UI limit enforced.
 * - No "add the same page twice": users can't currently duplicate a page within
 *   the combined output. Could be added later via a "duplicate" affordance.
 * - Source PDFs are loaded once per combinePdfPages call via the loaded Map (not
 *   cached across calls). Acceptable for the debounced merge cadence.
 */
export async function combinePdfPages(items: Array<CombinePdfPageRef>): Promise<CombinePdfResult> {
  if (items.length === 0) return EMPTY_RESULT

  const merged = await PDFDocument.create()
  const loaded = new Map<File, PDFDocument>()
  const skippedSet = new Set<string>()

  for (const { file, pageIndex } of items) {
    let src = loaded.get(file)
    if (!src) {
      const lower = file.name.toLowerCase()
      if (!lower.endsWith('.pdf')) {
        skippedSet.add(file.name)
        continue
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        src = await PDFDocument.load(bytes, { ignoreEncryption: true })
        loaded.set(file, src)
      } catch {
        skippedSet.add(file.name)
        continue
      }
    }
    if (pageIndex < 0 || pageIndex >= src.getPageCount()) continue
    const [copied] = await merged.copyPages(src, [pageIndex])
    merged.addPage(copied)
  }

  const pdfBytes = await merged.save()
  return { pdf: pdfBytes, pageCount: merged.getPageCount(), skipped: Array.from(skippedSet) }
}

export type PdfPageThumbnail = {
  pageIndex: number
  thumbnailUrl: string
}

/**
 * Render every page of a PDF as a small PNG data URL. Returns null if the
 * file is not a parseable PDF. Heavy operation — call in a background effect.
 *
 * Known limitations:
 * - Many-page perf: rendering 100+ pages will be slow and memory-heavy.
 *   Acceptable for typical use (combining a few small PDFs); no UI limit enforced.
 */
export async function readPdfPages(file: File): Promise<Array<PdfPageThumbnail> | null> {
  const lower = file.name.toLowerCase()
  if (!lower.endsWith('.pdf')) return null
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pdfjsLib = await import('pdfjs-dist')
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

    const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise
    const out: Array<PdfPageThumbnail> = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale: 0.3 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvas, viewport }).promise
      out.push({ pageIndex: i - 1, thumbnailUrl: canvas.toDataURL('image/png') })
    }
    return out
  } catch {
    return null
  }
}
