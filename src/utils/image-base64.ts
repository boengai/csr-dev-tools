import type { Base64ImageInfo } from '@/types/utils/base64-image'
import type { ImageBase64Result } from '@/types/utils/image-base64'

import { readFileAsDataUrl } from './file-read'
import { loadImageFromBlob } from './image'

const MAGIC_BYTES: ReadonlyArray<{ format: string; prefix: string }> = [
  { format: 'png', prefix: 'iVBOR' },
  { format: 'jpeg', prefix: '/9j/' },
  { format: 'gif', prefix: 'R0lGO' },
  { format: 'webp', prefix: 'UklGR' },
  { format: 'bmp', prefix: 'Qk' },
  { format: 'svg+xml', prefix: 'PHN2Z' },
  { format: 'svg+xml', prefix: 'PD94b' },
]

export const detectFormatFromBase64 = (base64: string): string | null => {
  for (const { format, prefix } of MAGIC_BYTES) {
    if (base64.startsWith(prefix)) return format
  }
  return null
}

export const formatBase64Size = (length: number): string => {
  if (length < 1024) return `${length} chars`
  if (length < 1024 * 1024) return `${(length / 1024).toFixed(1)} KB`
  return `${(length / (1024 * 1024)).toFixed(1)} MB`
}

export const imageFileToBase64 = async (file: File): Promise<ImageBase64Result> => {
  const [dataUri, img] = await Promise.all([readFileAsDataUrl(file), loadImageFromBlob(file)])
  const base64Only = dataUri.split(',')[1] ?? ''
  const { naturalHeight: height, naturalWidth: width } = img
  const safeName = file.name.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )
  const htmlTag = `<img src="${dataUri}" alt="${safeName}" width="${width}" height="${height}" />`

  return {
    base64Length: base64Only.length,
    base64Only,
    dataUri,
    fileName: file.name,
    height,
    htmlTag,
    originalSize: file.size,
    width,
  }
}

export const base64ToImageInfo = async (input: string): Promise<Base64ImageInfo> => {
  let dataUri: string
  let base64Only: string

  if (input.startsWith('data:')) {
    dataUri = input
    base64Only = input.split(',')[1] ?? ''
  } else {
    base64Only = input.trim()
    const detectedFormat = detectFormatFromBase64(base64Only)
    const assumedFormat = detectedFormat ?? 'png'
    dataUri = `data:image/${assumedFormat};base64,${base64Only}`
  }

  const estimatedSize = Math.ceil((base64Only.length * 3) / 4)
  const blob = await fetch(dataUri).then((r) => r.blob())
  const img = await loadImageFromBlob(blob)
  const { naturalHeight: height, naturalWidth: width } = img

  const formatMatch = dataUri.match(/^data:image\/([^;]+);/)
  const rawFormat = formatMatch?.[1] ?? detectFormatFromBase64(base64Only) ?? 'unknown'
  const format = rawFormat === 'svg+xml' ? 'svg' : rawFormat

  return { dataUri, estimatedSize, format, height, width }
}

export type { Base64ImageInfo } from '@/types/utils/base64-image'
export type { ImageBase64Result } from '@/types/utils/image-base64'
