import QRCode from 'qrcode'
import type { QrCodeOptions } from "@/types/utils/qr-code";

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

export type { QrErrorCorrectionLevel } from "@/types/utils/qr-code";
