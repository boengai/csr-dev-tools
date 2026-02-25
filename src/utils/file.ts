import type { ImageFormat } from '@/types'

const FILE_EXTENSIONS: Record<ImageFormat, string> = {
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * parse the file name to a valid file name
 * @param source - The file name to parse.
 * @returns A valid file name.
 */
export const parseFileName = (source: string, format?: ImageFormat): string => {
  const parts = source.split('.')
  const cleaned = parts
    .slice(0, -1) // remove the last part
    .join('_') // join the parts with a dot
    .replace(/[^a-zA-Z0-9-_]/g, '_') // replace all non-alphanumeric, - or _ characters with an underscore

  return `csr-dev-tools_${cleaned}_${Date.now()}.${format ? FILE_EXTENSIONS[format] : parts[parts.length - 1]}`
}

/**
 * Format byte count as human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * convert a data url to a blob
 * @param source - The data url to convert.
 * @returns A blob.
 */
export const parseDataUrlToBlob = async (source: string): Promise<Blob> => {
  const res = await fetch(source)
  return res.blob()
}

/**
 * Download a text string as a file via Blob URL
 */
export const downloadTextFile = (content: string, filename: string, mimeType = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
