import { THUMBNAIL_REDUCING_GAP } from '@/constants/image'
import type { ScaledDrawer } from '@/types'
import type { FaviconSize, FaviconResult } from '@/types/utils/favicon'

import { canvasToBlob, createScaledDrawer } from './canvas'

export const FAVICON_SIZES: Array<FaviconSize> = [
  { height: 16, name: 'favicon-16x16.png', rel: 'icon', width: 16 },
  { height: 32, name: 'favicon-32x32.png', rel: 'icon', width: 32 },
  { height: 48, name: 'favicon-48x48.png', rel: 'icon', width: 48 },
  { height: 180, name: 'apple-touch-icon.png', rel: 'apple-touch-icon', width: 180 },
  { height: 192, name: 'favicon-192x192.png', rel: 'icon', width: 192 },
  { height: 512, name: 'favicon-512x512.png', rel: 'icon', width: 512 },
]

/**
 * Letterbox an image into the given dimensions
 */
const resizeToCanvas = (
  draw: ScaledDrawer,
  img: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const scale = Math.min(width / img.width, height / img.height)
  const scaledW = img.width * scale
  const scaledH = img.height * scale
  const x = (width - scaledW) / 2
  const y = (height - scaledH) / 2
  draw(ctx, { height: img.height, width: img.width, x: 0, y: 0 }, { height: scaledH, width: scaledW, x, y })
  return canvas
}

/**
 * Generate favicons in all specified sizes from a source image
 */
export const generateFavicons = async (
  image: HTMLImageElement,
  sizes: Array<FaviconSize> = FAVICON_SIZES,
): Promise<Array<FaviconResult>> => {
  const results: Array<FaviconResult> = []
  const draw = createScaledDrawer(image, { reducingGap: THUMBNAIL_REDUCING_GAP })

  for (const size of sizes) {
    const canvas = resizeToCanvas(draw, image, size.width, size.height)
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

export type { FaviconSize, FaviconResult } from '@/types/utils/favicon'
