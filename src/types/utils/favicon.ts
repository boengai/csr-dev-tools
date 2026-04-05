export type FaviconSize = {
  height: number
  name: string
  rel: string
  width: number
}

export type FaviconResult = {
  blob: Blob
  dataUrl: string
  size: FaviconSize
}
