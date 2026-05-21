import type { UseDownload } from '@/types'
import { downloadBlob as triggerBlobDownload, downloadDataUrl as triggerDataUrlDownload } from '@/utils'

import { useToast } from './state'

export const useDownload = (): UseDownload => {
  const { showSuccess } = useToast()

  return {
    downloadBlob: (blob, filename) => {
      triggerBlobDownload(blob, filename)
      showSuccess(`Downloaded ${filename}`)
    },
    downloadDataUrl: (dataUrl, filename) => {
      triggerDataUrlDownload(dataUrl, filename)
      showSuccess(`Downloaded ${filename}`)
    },
  }
}
