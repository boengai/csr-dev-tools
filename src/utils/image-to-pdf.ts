import { degrees, PDFDocument } from 'pdf-lib'

export type ImageToPdfInput = {
  file: File
  rotation?: 0 | 90 | 180 | 270
}

export type ImageToPdfResult = {
  pdf: Uint8Array
  pageCount: number
  skipped: Array<string>
}

const EMPTY_RESULT: ImageToPdfResult = {
  pdf: new Uint8Array(0),
  pageCount: 0,
  skipped: [],
}

/**
 * Embed each PNG/JPEG file as its own PDF page sized to the image's native
 * pixel dimensions. Per-item rotation (0/90/180/270) is applied to the
 * page metadata, not by re-encoding the image. Unsupported file types are
 * returned in `skipped` so the UI can surface them.
 */
export async function imagesToPdf(items: Array<ImageToPdfInput>): Promise<ImageToPdfResult> {
  if (items.length === 0) return EMPTY_RESULT

  const pdf = await PDFDocument.create()
  const skipped: Array<string> = []

  for (const item of items) {
    const bytes = new Uint8Array(await item.file.arrayBuffer())
    const lower = item.file.name.toLowerCase()
    let image
    if (lower.endsWith('.png')) {
      image = await pdf.embedPng(bytes)
    } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      image = await pdf.embedJpg(bytes)
    } else {
      skipped.push(item.file.name)
      continue
    }
    const { width, height } = image
    const page = pdf.addPage([width, height])
    page.drawImage(image, { x: 0, y: 0, width, height })
    if (item.rotation) {
      page.setRotation(degrees(item.rotation))
    }
  }

  const pdfBytes = await pdf.save()
  return { pdf: pdfBytes, pageCount: pdf.getPageCount(), skipped }
}
