import { useMemo } from 'react'

import { useBlobUrl } from '@/hooks'

type DownloadPdfButtonProps = {
  bytes: Uint8Array
  filename: string
}

export const DownloadPdfButton = ({ bytes, filename }: DownloadPdfButtonProps) => {
  const blob = useMemo(() => {
    if (bytes.byteLength === 0) return null
    return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
  }, [bytes])

  const href = useBlobUrl(blob)

  if (href === null) {
    return (
      <button
        className="rounded-md bg-gray-800 px-3 py-1 text-body-xs font-medium text-gray-500"
        disabled
        type="button"
      >
        Download PDF
      </button>
    )
  }

  return (
    <a
      className="rounded-md bg-blue-600 px-3 py-1 text-body-xs font-medium text-white hover:bg-blue-500"
      download={filename}
      href={href}
    >
      Download PDF
    </a>
  )
}
