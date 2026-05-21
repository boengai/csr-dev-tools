const triggerDownload = (href: string, filename: string): void => {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  queueMicrotask(() => {
    URL.revokeObjectURL(url)
  })
}

export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  triggerDownload(dataUrl, filename)
}

export const downloadSvg = (svgString: string, filename: string): void => {
  downloadBlob(new Blob([svgString], { type: 'image/svg+xml' }), filename)
}

export const downloadPemFile = (content: string, filename: string): void => {
  downloadBlob(new Blob([content], { type: 'application/x-pem-file' }), filename)
}
