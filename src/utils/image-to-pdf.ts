import { PDFDocument } from 'pdf-lib'

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
 * pixel dimensions. Unsupported file types are returned in `skipped` so the
 * UI can surface them.
 */
export async function imagesToPdf(files: Array<File>): Promise<ImageToPdfResult> {
  if (files.length === 0) return EMPTY_RESULT

  const pdf = await PDFDocument.create()
  const skipped: Array<string> = []

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const lower = file.name.toLowerCase()
    let image
    if (lower.endsWith('.png')) {
      image = await pdf.embedPng(bytes)
    } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      image = await pdf.embedJpg(bytes)
    } else {
      skipped.push(file.name)
      continue
    }
    const { width, height } = image
    const page = pdf.addPage([width, height])
    page.drawImage(image, { x: 0, y: 0, width, height })
  }

  const pdfBytes = await pdf.save()
  return { pdf: pdfBytes, pageCount: pdf.getPageCount(), skipped }
}
