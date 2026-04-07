import type { QrCodeOptions } from '@/types/utils/qr-code'
import { generateQrCodeDataUrl, generateQrCodeSvgString } from '@/wasm/csr-qrcode'

export { generateQrCodeDataUrl, generateQrCodeSvgString }
export type { QrErrorCorrectionLevel } from '@/types/utils/qr-code'
