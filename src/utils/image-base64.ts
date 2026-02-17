export type ImageBase64Result = {
  base64Length: number
  base64Only: string
  dataUri: string
  fileName: string
  height: number
  htmlTag: string
  originalSize: number
  width: number
}

const getImageDimensions = (dataUri: string): Promise<{ height: number; width: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ height: img.naturalHeight, width: img.naturalWidth })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUri
  })

export const imageFileToBase64 = (file: File): Promise<ImageBase64Result> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const dataUri = reader.result as string
        const base64Only = dataUri.split(',')[1] ?? ''
        const { height, width } = await getImageDimensions(dataUri)
        const htmlTag = `<img src="${dataUri}" alt="${file.name}" width="${width}" height="${height}" />`

        resolve({
          base64Length: base64Only.length,
          base64Only,
          dataUri,
          fileName: file.name,
          height,
          htmlTag,
          originalSize: file.size,
          width,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

export const formatBase64Size = (length: number): string => {
  if (length < 1024) return `${length} chars`
  if (length < 1024 * 1024) return `${(length / 1024).toFixed(1)} KB`
  return `${(length / (1024 * 1024)).toFixed(1)} MB`
}
