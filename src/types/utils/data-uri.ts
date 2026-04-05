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
