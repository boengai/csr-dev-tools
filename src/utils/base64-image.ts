export type Base64ImageInfo = {
  dataUri: string
  estimatedSize: number
  format: string
  height: number
  width: number
}

const MAGIC_BYTES: Array<{ format: string; prefix: string }> = [
  { format: 'png', prefix: 'iVBOR' },
  { format: 'jpeg', prefix: '/9j/' },
  { format: 'gif', prefix: 'R0lGO' },
  { format: 'webp', prefix: 'UklGR' },
  { format: 'bmp', prefix: 'Qk' },
  { format: 'svg+xml', prefix: 'PHN2Z' },
]

const detectFormatFromBase64 = (base64: string): string | null => {
  for (const { format, prefix } of MAGIC_BYTES) {
    if (base64.startsWith(prefix)) return format
  }
  return null
}

const getImageDimensions = (dataUri: string): Promise<{ height: number; width: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ height: img.naturalHeight, width: img.naturalWidth })
    img.onerror = () => reject(new Error('Failed to load image from Base64'))
    img.src = dataUri
  })

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
  const { height, width } = await getImageDimensions(dataUri)

  const formatMatch = dataUri.match(/^data:image\/([^;]+);/)
  const format = formatMatch?.[1] ?? detectFormatFromBase64(base64Only) ?? 'unknown'

  return { dataUri, estimatedSize, format, height, width }
}
