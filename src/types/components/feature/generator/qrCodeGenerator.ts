import type { QrErrorCorrectionLevel } from '@/utils'

export type State = {
  background: string
  dataUrl: string
  dialogOpen: boolean
  errorCorrection: QrErrorCorrectionLevel
  foreground: string
  size: number
  svgString: string
  text: string
}

export type Action =
  | { type: 'SET_BACKGROUND'; payload: string }
  | { type: 'SET_DATA_URL'; payload: string }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_ERROR_CORRECTION'; payload: QrErrorCorrectionLevel }
  | { type: 'SET_FOREGROUND'; payload: string }
  | { type: 'SET_SIZE'; payload: number }
  | { type: 'SET_SVG_STRING'; payload: string }
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'GENERATE_SUCCESS'; payload: { dataUrl: string; svgString: string } }
  | { type: 'CLEAR_OUTPUT' }
  | { type: 'RESET' }
