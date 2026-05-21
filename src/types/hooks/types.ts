export type UseCopyToClipboard = (val: string) => void

export type UseDownload = {
  downloadBlob: (blob: Blob, filename: string) => void
  downloadDataUrl: (dataUrl: string, filename: string) => void
}
