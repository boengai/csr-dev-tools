import type { QrErrorCorrectionLevel } from '@/types/utils/qr-code'

export type QrInput = {
  background: string
  errorCorrection: QrErrorCorrectionLevel
  foreground: string
  size: number
  text: string
}

export type QrResult = { dataUrl: string; svgString: string }
