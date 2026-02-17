import JSZip from 'jszip'

export type FaviconSize = {
  height: number
  name: string
  rel: string
  width: number
}

export type FaviconResult = {
  blob: Blob
  dataUrl: string
  size: FaviconSize
}

export const FAVICON_SIZES: Array<FaviconSize> = [
  { height: 16, name: 'favicon-16x16.png', rel: 'icon', width: 16 },
  { height: 32, name: 'favicon-32x32.png', rel: 'icon', width: 32 },
  { height: 48, name: 'favicon-48x48.png', rel: 'icon', width: 48 },
  { height: 180, name: 'apple-touch-icon.png', rel: 'apple-touch-icon', width: 180 },
  { height: 192, name: 'favicon-192x192.png', rel: 'icon', width: 192 },
  { height: 512, name: 'favicon-512x512.png', rel: 'icon', width: 512 },
]

/**
 * Resize an image to the given dimensions using Canvas API
 */
const resizeToCanvas = (img: HTMLImageElement, width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

/**
 * Convert a canvas to a Blob
 */
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, 'image/png')
  })
}

/**
 * Generate favicons in all specified sizes from a source image
 */
export const generateFavicons = async (
  image: HTMLImageElement,
  sizes: Array<FaviconSize> = FAVICON_SIZES,
): Promise<Array<FaviconResult>> => {
  const results: Array<FaviconResult> = []

  for (const size of sizes) {
    const canvas = resizeToCanvas(image, size.width, size.height)
    const dataUrl = canvas.toDataURL('image/png')
    const blob = await canvasToBlob(canvas)
    results.push({ blob, dataUrl, size })
  }

  return results
}

/**
 * Generate HTML link tags for favicon integration
 */
export const generateFaviconLinkTags = (sizes: Array<FaviconSize> = FAVICON_SIZES): string => {
  return sizes
    .map((size) => {
      if (size.rel === 'apple-touch-icon') {
        return `<link rel="apple-touch-icon" sizes="${size.width}x${size.height}" href="/${size.name}">`
      }
      return `<link rel="icon" type="image/png" sizes="${size.width}x${size.height}" href="/${size.name}">`
    })
    .join('\n')
}

/**
 * Download all favicon results as a ZIP file
 */
export const downloadFaviconsAsZip = async (results: Array<FaviconResult>): Promise<void> => {
  const zip = new JSZip()

  for (const result of results) {
    zip.file(result.size.name, result.blob)
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = 'favicons.zip'
  a.click()
  URL.revokeObjectURL(url)
}
