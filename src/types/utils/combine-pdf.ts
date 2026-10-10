export type CombinePdfPageRef = {
  file: File
  pageIndex: number // 0-based
}

export type CombinePdfResult = {
  pdf: Uint8Array
  pageCount: number
  skipped: Array<string> // distinct filenames that failed to load
}

export type PdfPageThumbnail = {
  pageIndex: number
  thumbnailUrl: string
}
