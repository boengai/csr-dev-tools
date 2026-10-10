import type { UseDownload } from '@/types'
import {
  downloadBlob as triggerBlobDownload,
  downloadDataUrl as triggerDataUrlDownload,
  downloadPemFile as triggerPemDownload,
  downloadSvg as triggerSvgDownload,
} from '@/utils'

import { useToast } from './state'

export const useDownload = (): UseDownload => {
  const showSuccess = useToast((s) => s.showSuccess)

  return {
    downloadBlob: (blob, filename) => {
      triggerBlobDownload(blob, filename)
      showSuccess(`Downloaded ${filename}`)
    },
    downloadDataUrl: (dataUrl, filename) => {
      triggerDataUrlDownload(dataUrl, filename)
      showSuccess(`Downloaded ${filename}`)
    },
    downloadPemFile: (content, filename) => {
      triggerPemDownload(content, filename)
      showSuccess(`Downloaded ${filename}`)
    },
    downloadSvg: (svgString, filename) => {
      triggerSvgDownload(svgString, filename)
      showSuccess(`Downloaded ${filename}`)
    },
  }
}
