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
