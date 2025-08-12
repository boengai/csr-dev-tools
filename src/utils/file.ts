import type { ImageFormat } from '@/types'

const FILE_EXTENSIONS: Record<ImageFormat, string> = {
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
  const parts: Array<string> = source.split('.')
  const cleaned: string = parts
    .slice(0, -1) // remove the last part
    .join('_') // join the parts with a dot
    .replace(/[^a-zA-Z0-9-_]/g, '_') // replace all non-alphanumeric, - or _ characters with an underscore

  return `csr-dev-tools_${cleaned}_${Date.now()}.${format ? FILE_EXTENSIONS[format] : parts[parts.length - 1]}`
}

/**
 * convert a data url to a blob
 * @param source - The data url to convert.
 * @returns A blob.
 */
export const parseDataUrlToBlob = async (source: string): Promise<Blob> => {
  const res: Response = await fetch(source)
  return res.blob()
}
