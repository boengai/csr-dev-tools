export const buildZipBlob = async (files: Record<string, Blob | string>): Promise<Blob> => {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content)
  }
  return zip.generateAsync({ type: 'blob' })
}
