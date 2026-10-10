export type ImageToPdfInput = {
  file: File
  rotation?: 0 | 90 | 180 | 270
}

export type ImageToPdfResult = {
  pdf: Uint8Array
  pageCount: number
  skipped: Array<string>
}

export type ImageToPdfLayout = 'one-per-page' | 'grid-2x2'

export type ImageToPdfOptions = {
  layout?: ImageToPdfLayout // default: 'one-per-page'
}
