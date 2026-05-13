import type { QrErrorCorrectionLevel } from '@/utils'

export type QrCodeState = {
  background: string
  dialogOpen: boolean
  errorCorrection: QrErrorCorrectionLevel
  foreground: string
  size: number
  text: string
}

export type QrCodeAction =
  | { type: 'SET_BACKGROUND'; payload: string }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_ERROR_CORRECTION'; payload: QrErrorCorrectionLevel }
  | { type: 'SET_FOREGROUND'; payload: string }
  | { type: 'SET_SIZE'; payload: number }
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'RESET' }

export type QrInput = {
  background: string
  errorCorrection: QrErrorCorrectionLevel
  foreground: string
  size: number
  text: string
}

export type QrResult = { dataUrl: string; svgString: string }
