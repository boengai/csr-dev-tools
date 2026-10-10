export type ImageToPdfItem = {
  id: string
  file: File
  rotation: 0 | 90 | 180 | 270
}

export type ImageToPdfExtras = { onePerPage: boolean }

export type ImageToPdfCardProps = {
  item: ImageToPdfItem
  pageNumber: number
  onRemove: () => void
  onRotate: () => void
}
