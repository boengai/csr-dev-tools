export type CombinePdfPageItem = {
  id: string
  file: File
  sourceFileName: string
  sourcePageIndex: number
  thumbnailUrl: string
}

export type CombinePdfLoadingFile = {
  id: string
  fileName: string
}

export type CombinePdfPageCardProps = {
  item: CombinePdfPageItem
  position: number
  onRemove: () => void
}
