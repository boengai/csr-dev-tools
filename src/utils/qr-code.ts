import QRCode from 'qrcode'

export type QrCodeOptions = {
  background?: string
  errorCorrectionLevel?: 'H' | 'L' | 'M' | 'Q'
  foreground?: string
  size?: number
}

export const generateQrCodeDataUrl = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { background = '#ffffff', errorCorrectionLevel = 'M', foreground = '#000000', size = 256 } = options

  return QRCode.toDataURL(text, {
    color: { dark: foreground, light: background },
    errorCorrectionLevel,
    margin: 2,
    width: size,
  })
}

export const generateQrCodeSvgString = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { background = '#ffffff', errorCorrectionLevel = 'M', foreground = '#000000', size = 256 } = options

  return QRCode.toString(text, {
    color: { dark: foreground, light: background },
    errorCorrectionLevel,
    margin: 2,
    type: 'svg',
    width: size,
  })
}
