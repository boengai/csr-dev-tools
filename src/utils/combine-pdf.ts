import { PDFDocument } from 'pdf-lib'

import type { CombinePdfPageRef, CombinePdfResult, PdfPageThumbnail } from '@/types'
import { decryptPdf } from '@/wasm/pdf-decrypt'

const EMPTY_RESULT: CombinePdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }

/**
 * Decryptions of the encrypted files seen so far, finished or still running.
 * The merge reruns on every re-order, possibly before the last run ends, and
 * decrypting a large file takes seconds, so each file is decrypted once. A
 * null result (the file can't be decrypted) is kept; a rejection (the decrypt
 * step didn't load) is dropped, so the next merge tries again. An entry goes
 * when its File does.
 */
const decryptedBytes = new WeakMap<File, Promise<Uint8Array | null>>()

function decryptOnce(file: File, bytes: Uint8Array): Promise<Uint8Array | null> {
  const known = decryptedBytes.get(file)
  if (known) return known
  const decrypting = decryptPdf(bytes)
  decryptedBytes.set(file, decrypting)
  decrypting.catch(() => {
    if (decryptedBytes.get(file) === decrypting) decryptedBytes.delete(file)
  })
  return decrypting
}

/**
 * Load a source PDF for copying. pdf-lib can't decrypt, and copying pages out
 * of a still-encrypted document writes blank pages, so an encrypted file is
 * decrypted first. Resolves to null when the file can't be used (it can't be
 * read, needs a password, or isn't a PDF): the caller skips it. Rejects when the decrypt
 * step can't load, so the merge fails rather than quietly dropping a file.
 *
 * Any failed load goes to the decrypt step, not only pdf-lib's
 * `EncryptedPDFError`: pdf-lib ships ES5 classes, so `instanceof` can't tell
 * that error from another. The decrypt step rejects a file that isn't a PDF,
 * and the second load is as strict as the first, so a document that still
 * declares `/Encrypt` never reaches `copyPages`.
 */
async function loadSource(file: File): Promise<PDFDocument | null> {
  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(await file.arrayBuffer())
  } catch {
    // The file can't be read any more, e.g. it changed on disk after upload.
    return null
  }
  if (!decryptedBytes.has(file)) {
    try {
      return await PDFDocument.load(bytes)
    } catch {
      // Not loadable as is: try the decrypt step below.
    }
  }
  const decrypted = await decryptOnce(file, bytes)
  if (!decrypted) return null
  try {
    return await PDFDocument.load(decrypted)
  } catch {
    return null
  }
}

/**
 * Combine arbitrary pages from arbitrary PDFs into one PDF in the given order.
 * Each input ref names a source file + a 0-based page index. The same file may
 * appear multiple times with different page indices; this loads each file once
 * (cached by File reference) and copies pages in order. Files that fail to load,
 * or that need a password to open, land in `skipped`, once per file.
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
  // Files that failed this call. Not kept between calls: the decrypt step also
  // fails when its WASM can not be fetched, and a later merge may succeed.
  const failed = new Set<File>()
  const skipped: Array<string> = []

  for (const { file, pageIndex } of items) {
    if (failed.has(file)) continue
    let src = loaded.get(file)
    if (!src) {
      const lower = file.name.toLowerCase()
      if (!lower.endsWith('.pdf')) {
        failed.add(file)
        skipped.push(file.name)
        continue
      }
      // A rejection here means the decrypt step didn't load: fail the merge.
      const source = await loadSource(file)
      if (!source) {
        failed.add(file)
        skipped.push(file.name)
        continue
      }
      src = source
      loaded.set(file, src)
    }
    if (pageIndex < 0 || pageIndex >= src.getPageCount()) continue
    const [copied] = await merged.copyPages(src, [pageIndex])
    merged.addPage(copied)
  }

  // pdf-lib saves an empty document with one blank page, which would offer a
  // download of nothing. Return no bytes, so the shell shows only the skips.
  if (merged.getPageCount() === 0) return { ...EMPTY_RESULT, skipped }
  const pdfBytes = await merged.save()
  return { pdf: pdfBytes, pageCount: merged.getPageCount(), skipped }
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
