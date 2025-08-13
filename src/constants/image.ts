import type { ImageFormat } from '@/types'

export const IMAGE_LABEL: Record<ImageFormat, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}

export const IMAGE_VALUE: Record<ImageFormat, string> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
}
