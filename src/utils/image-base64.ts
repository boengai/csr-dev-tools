import type { ImageBase64Result } from '@/types/utils/image-base64'

import { readFileAsDataUrl } from './file-read'

const getImageDimensions = (dataUri: string): Promise<{ height: number; width: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ height: img.naturalHeight, width: img.naturalWidth })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUri
  })

export const imageFileToBase64 = async (file: File): Promise<ImageBase64Result> => {
  const dataUri = await readFileAsDataUrl(file)
  const base64Only = dataUri.split(',')[1] ?? ''
  const { height, width } = await getImageDimensions(dataUri)
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

export const formatBase64Size = (length: number): string => {
  if (length < 1024) return `${length} chars`
  if (length < 1024 * 1024) return `${(length / 1024).toFixed(1)} KB`
  return `${(length / (1024 * 1024)).toFixed(1)} MB`
}

export type { ImageBase64Result } from '@/types/utils/image-base64'
