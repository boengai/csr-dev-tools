import { useDownload } from '@/hooks'
import type { DownloadPdfButtonProps } from '@/types'

import { Button } from '../button'
import { DownloadIcon } from '../icon'

export const DownloadPdfButton = ({ bytes, filenameSlug }: DownloadPdfButtonProps) => {
  const { downloadBlob } = useDownload()

  const handleDownload = () => {
    const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
    downloadBlob(blob, `csr-dev-tools_${filenameSlug}_${Date.now()}.pdf`)
  }

  return (
    <Button disabled={bytes.byteLength === 0} icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
      Download
    </Button>
  )
}
