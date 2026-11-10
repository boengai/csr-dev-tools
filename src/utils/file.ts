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
 * Resolves a filename collision by suffixing the stem: `a.webp` → `a-1.webp`,
 * `a-2.webp`, … until `isTaken` says the candidate is free. Does not sanitize
 * or otherwise build the name (that stays at the call site, per ADR 0023).
 */
export const dedupeFileName = (name: string, isTaken: (candidate: string) => boolean): string => {
  if (!isTaken(name)) return name
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let n = 1
  while (isTaken(`${stem}-${n}${ext}`)) n++
  return `${stem}-${n}${ext}`
}

/**
 * Whether `file` satisfies an `<input accept>` string: comma-separated MIME
 * types (`image/png`), `type/*` wildcards, or `.ext` suffixes. An empty
 * `accept` takes anything. Dropped files bypass the picker's filter, so
 * shells re-check them with this.
 */
export const matchesAccept = (file: File, accept: string): boolean => {
  const tokens = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (tokens.length === 0) return true
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token)
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1))
    return type === token
  })
}
