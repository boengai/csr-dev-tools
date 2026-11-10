import type { QrErrorCorrectionLevel } from '@/types/utils/qr-code'

export type QrInput = {
  background: string
  errorCorrection: QrErrorCorrectionLevel
  foreground: string
  size: number
  /** The text or URL to encode. */
  source: string
}
