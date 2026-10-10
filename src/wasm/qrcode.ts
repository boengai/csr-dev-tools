import type { QrCodeOptions } from '@/types/utils/qr-code'
import type { QrcodeWasm } from '@/types/wasm/ffi'

import { loadWasm } from './init'

export const generateQrCodeDataUrl = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<QrcodeWasm>('qrcode')
  return wasm.generate_qr_png_data_url(text, size, foreground, background, errorCorrectionLevel)
}

export const generateQrCodeSvgString = async (text: string, options: QrCodeOptions = {}): Promise<string> => {
  const { size = 256, foreground = '#000000', background = '#ffffff', errorCorrectionLevel = 'M' } = options
  const wasm = await loadWasm<QrcodeWasm>('qrcode')
  return wasm.generate_qr_svg_string(text, size, foreground, background, errorCorrectionLevel)
}
