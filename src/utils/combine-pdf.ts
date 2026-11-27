import { PDFDocument } from 'pdf-lib'

import type { CombinePdfPageRef, CombinePdfResult, PdfPageThumbnail } from '@/types'
import { decryptPdf } from '@/wasm/pdf-decrypt'

const EMPTY_RESULT: CombinePdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }

/**
 * Decrypted bytes of the encrypted files seen so far. The merge reruns on every
 * re-order, and decrypting a large file takes seconds, so each file is
 * decrypted once. An entry goes when its File does.
 */
const decryptedBytes = new WeakMap<File, Uint8Array>()

/**
 * Load a source PDF for copying. pdf-lib can't decrypt, and copying pages out
 * of a still-encrypted document writes blank pages, so an encrypted file is
 * decrypted first. Rejects when the file needs a password: the caller skips it.
 *
 * Any failed load goes to the decrypt step, not only pdf-lib's
 * `EncryptedPDFError`: pdf-lib ships ES5 classes, so `instanceof` can't tell
 * that error from another. The decrypt step rejects a file that isn't a PDF,
 * and the second load is as strict as the first, so a document that still
 * declares `/Encrypt` never reaches `copyPages`.
 */
async function loadSource(file: File): Promise<PDFDocument> {
  const known = decryptedBytes.get(file)
  if (known) return PDFDocument.load(known)

  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    return await PDFDocument.load(bytes)
  } catch {
    const decrypted = await decryptPdf(bytes)
    const doc = await PDFDocument.load(decrypted)
    decryptedBytes.set(file, decrypted)
    return doc
  }
}

/**
 * Combine arbitrary pages from arbitrary PDFs into one PDF in the given order.
 * Each input ref names a source file + a 0-based page index. The same file may
 * appear multiple times with different page indices; this loads each file once
 * (cached by File reference) and copies pages in order. Files that fail to load,
 * or that need a password to open, land in `skipped` (deduplicated).
 *
 * Known limitations:
 * - Many-page perf: rendering 100+ page thumbnails will be slow and memory-heavy.
 *   Acceptable for typical use (combining a few small PDFs); no UI limit enforced.
 * - No "add the same page twice": users can't currently duplicate a page within
 *   the combined output. Could be added later via a "duplicate" affordance.
 * - Source PDFs are loaded once per combinePdfPages call via the loaded Map (not
 *   cached across calls). Acceptable for the debounced merge cadence. Only the
 *   decrypted bytes of an encrypted file are kept between calls.
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
        src = await loadSource(file)
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
