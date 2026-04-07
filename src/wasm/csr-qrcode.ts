import type { QrCodeOptions } from '@/types/utils/qr-code'

import { loadWasm } from './init'

type CsrQrcode = {
  generate_qr_png_data_url: (data: string, size: number, fg: string, bg: string, ec: string) => string
  generate_qr_svg_string: (data: string, size: number, fg: string, bg: string, ec: string) => string
}

export const generateQrCodeDataUrl = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<CsrQrcode>('csr-qrcode')
  return wasm.generate_qr_png_data_url(text, size, foreground, background, errorCorrectionLevel)
}

export const generateQrCodeSvgString = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<CsrQrcode>('csr-qrcode')
  return wasm.generate_qr_svg_string(text, size, foreground, background, errorCorrectionLevel)
}
