import { Button, DownloadIcon } from '@/components/common'
import { useDownload } from '@/hooks'

type DownloadPdfButtonProps = {
  bytes: Uint8Array
  filename: string
}

export const DownloadPdfButton = ({ bytes, filename }: DownloadPdfButtonProps) => {
  const { downloadBlob } = useDownload()

  const handleDownload = () => {
    const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
    downloadBlob(blob, filename)
  }

  return (
    <Button
      disabled={bytes.byteLength === 0}
      icon={<DownloadIcon />}
      onClick={handleDownload}
      variant="primary"
    >
      Download
    </Button>
  )
}
