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

export type ImageToPdfLayout = 'one-per-page' | 'grid-2x2'

export type ImageToPdfOptions = {
  layout?: ImageToPdfLayout // default: 'one-per-page'
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
export async function imagesToPdf(
  items: Array<ImageToPdfInput>,
  options: ImageToPdfOptions = {},
): Promise<ImageToPdfResult> {
  if (items.length === 0) return EMPTY_RESULT
  const layout = options.layout ?? 'one-per-page'
  if (layout === 'one-per-page') return buildOnePerPage(items)
  return buildGrid2x2(items)
}

async function buildOnePerPage(items: Array<ImageToPdfInput>): Promise<ImageToPdfResult> {
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

/**
 * Arrange up to 4 images per US Letter portrait page in a 2×2 grid.
 * Each image is contained within its cell preserving aspect ratio.
 *
 * Known v1 limitation: per-image rotation (set in one-per-page mode) is NOT
 * applied in grid mode. pdf-lib's drawImage rotates around the image's
 * bottom-left corner; correctly pivoting around the cell center requires
 * additional transform math. Images are drawn upright regardless of their
 * rotation property. Tracked for v2.
 */
async function buildGrid2x2(items: Array<ImageToPdfInput>): Promise<ImageToPdfResult> {
  const pdf = await PDFDocument.create()
  const skipped: Array<string> = []

  const PAGE_W = 612
  const PAGE_H = 792
  const MARGIN = 36
  const GAP = 18
  const COLS = 2
  const ROWS = 2
  const CELL_W = (PAGE_W - 2 * MARGIN - (COLS - 1) * GAP) / COLS
  const CELL_H = (PAGE_H - 2 * MARGIN - (ROWS - 1) * GAP) / ROWS
  const PER_PAGE = COLS * ROWS

  type Embedded = { image: Awaited<ReturnType<typeof pdf.embedPng>> }
  const embedded: Array<Embedded> = []

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
    embedded.push({ image })
  }

  for (let pageStart = 0; pageStart < embedded.length; pageStart += PER_PAGE) {
    const page = pdf.addPage([PAGE_W, PAGE_H])
    const slice = embedded.slice(pageStart, pageStart + PER_PAGE)

    for (let idx = 0; idx < slice.length; idx++) {
      const col = idx % COLS
      const row = Math.floor(idx / COLS)
      const cellX = MARGIN + col * (CELL_W + GAP)
      // PDF y-axis is bottom-up; row 0 is the top row
      const cellY = PAGE_H - MARGIN - (row + 1) * CELL_H - row * GAP

      const { image } = slice[idx]
      const aspectImg = image.width / image.height
      const aspectCell = CELL_W / CELL_H
      let drawW: number
      let drawH: number
      if (aspectImg > aspectCell) {
        drawW = CELL_W
        drawH = CELL_W / aspectImg
      } else {
        drawH = CELL_H
        drawW = CELL_H * aspectImg
      }
      const drawX = cellX + (CELL_W - drawW) / 2
      const drawY = cellY + (CELL_H - drawH) / 2

      page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH })
    }
  }

  const bytes = await pdf.save()
  return { pdf: bytes, pageCount: pdf.getPageCount(), skipped }
}
