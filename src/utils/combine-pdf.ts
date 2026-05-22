import { PDFDocument } from 'pdf-lib'

export type CombinePdfInput = {
  file: File
}

export type CombinePdfResult = {
  pdf: Uint8Array
  pageCount: number
  skipped: Array<string>
}

const EMPTY_RESULT: CombinePdfResult = { pdf: new Uint8Array(0), pageCount: 0, skipped: [] }

/**
 * Concatenate the pages of multiple PDFs into one PDF in the given order.
 * Non-PDF files (or files that fail to parse) are returned in `skipped`.
 */
export async function combinePdfs(items: Array<CombinePdfInput>): Promise<CombinePdfResult> {
  if (items.length === 0) return EMPTY_RESULT

  const merged = await PDFDocument.create()
  const skipped: Array<string> = []

  for (const item of items) {
    const lower = item.file.name.toLowerCase()
    if (!lower.endsWith('.pdf')) {
      skipped.push(item.file.name)
      continue
    }
    try {
      const bytes = new Uint8Array(await item.file.arrayBuffer())
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const copied = await merged.copyPages(src, src.getPageIndices())
      for (const page of copied) merged.addPage(page)
    } catch {
      skipped.push(item.file.name)
    }
  }

  const pdfBytes = await merged.save()
  return { pdf: pdfBytes, pageCount: merged.getPageCount(), skipped }
}

/**
 * Read a PDF's page count + render its first page as a small PNG data URL,
 * for use as a thumbnail in the source-file list. Returns `null` for both if
 * the file is not a parseable PDF.
 */
export async function readPdfMeta(file: File): Promise<{ pageCount: number; thumbnailUrl: string } | null> {
  const lower = file.name.toLowerCase()
  if (!lower.endsWith('.pdf')) return null
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pdfjsLib = await import('pdfjs-dist')
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

    const doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise
    const pageCount = doc.numPages

    const page = await doc.getPage(1)
    const viewport = page.getViewport({ scale: 0.3 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvas, viewport }).promise
    const thumbnailUrl = canvas.toDataURL('image/png')

    return { pageCount, thumbnailUrl }
  } catch {
    return null
  }
}
