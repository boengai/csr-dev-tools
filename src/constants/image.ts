import type { ImageFormat } from '@/types'

export const IMAGE_LABEL: Record<ImageFormat, string> = {
  'image/avif': 'AVIF',
  'image/bmp': 'BMP',
  'image/gif': 'GIF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}

export const IMAGE_VALUE: Record<ImageFormat, string> = {
  'image/avif': 'image/avif',
  'image/bmp': 'image/bmp',
  'image/gif': 'image/gif',
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
}

export const LOSSY_FORMATS: ReadonlySet<ImageFormat> = new Set(['image/avif', 'image/jpeg', 'image/webp'])

export const COMPRESSIBLE_FORMATS: ReadonlySet<string> = new Set(['image/jpeg', 'image/webp'])

/**
 * Pillow's `thumbnail()` default reducing gap, for generators that render many
 * sizes of one image (favicons, PWA icons, splash screens): a little less exact
 * than the Image Resizer's gap of 3, and faster wherever a size is reduced 4x
 * or more (below that neither gap pre-reduces).
 */
export const THUMBNAIL_REDUCING_GAP = 2
