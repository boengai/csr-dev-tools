export type QrErrorCorrectionLevel = 'H' | 'L' | 'M' | 'Q'

export type QrCodeOptions = {
  background?: string
  errorCorrectionLevel?: QrErrorCorrectionLevel
  foreground?: string
  size?: number
}
