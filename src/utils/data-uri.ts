export type DataUriEncodeResult = {
  base64Only: string
  cssUrl: string | null
  dataUri: string
  encodedSize: number
  fileName: string
  htmlImgTag: string | null
  isCssCompatible: boolean
  isImage: boolean
  isLargeFile: boolean
  mimeType: string
  originalSize: number
}

export type DataUriDecodeResult = {
  data: string
  decodedSize: number
  encoding: string
  isImage: boolean
  mimeType: string
  previewUri: string | null
}

export const SIZE_WARNING_THRESHOLD = 30 * 1024

export const isImageMimeType = (mimeType: string): boolean => mimeType.startsWith('image/')

export const isCssCompatibleMimeType = (mimeType: string): boolean =>
  mimeType.startsWith('image/') ||
  mimeType.startsWith('font/') ||
  mimeType === 'application/font-woff' ||
  mimeType === 'application/font-woff2'

export const isValidDataUri = (value: string): boolean => /^data:[^;]+;[^,]+,.+$/.test(value)

export const fileToDataUri = (file: File): Promise<DataUriEncodeResult> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUri = reader.result as string
      const base64Only = dataUri.split(',')[1] ?? ''
      const mimeType = file.type || 'application/octet-stream'
      const isImage = isImageMimeType(mimeType)
      const isCssCompatible = isCssCompatibleMimeType(mimeType)

      const safeName = file.name.replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
      )

      const htmlImgTag = isImage ? `<img src="${dataUri}" alt="${safeName}" />` : null
      const cssUrl = isCssCompatible ? `url('${dataUri}')` : null

      resolve({
        base64Only,
        cssUrl,
        dataUri,
        encodedSize: dataUri.length,
        fileName: file.name,
        htmlImgTag,
        isCssCompatible,
        isImage,
        isLargeFile: file.size > SIZE_WARNING_THRESHOLD,
        mimeType,
        originalSize: file.size,
      })
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

export const parseDataUri = (uri: string): DataUriDecodeResult => {
  const match = uri.match(/^data:([^;]+);([^,]+),(.*)$/)
  if (!match) {
    throw new Error('Invalid data URI format')
  }

  const [, mimeType, encoding, data] = match as [string, string, string, string]
  const isImage = isImageMimeType(mimeType)
  const padding = encoding === 'base64' ? (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0) : 0
  const decodedSize = encoding === 'base64' ? Math.ceil((data.length * 3) / 4) - padding : data.length

  return {
    data,
    decodedSize,
    encoding,
    isImage,
    mimeType,
    previewUri: isImage ? uri : null,
  }
}
