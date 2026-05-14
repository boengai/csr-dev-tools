export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  queueMicrotask(() => {
    URL.revokeObjectURL(url)
  })
}

export const downloadBlobsAsZip = async (
  files: Record<string, Blob | string>,
  zipName: string,
): Promise<Blob> => {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, zipName)
  return blob
}
