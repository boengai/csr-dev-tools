import type { BgOption } from './result'

export * from './error'
export * from './processing'
export * from './result'

export type BackgroundRemoverState = {
  bgOption: BgOption
  customColor: string
  dialogOpen: boolean
  displayBlob: Blob | null
  downloading: boolean
  error: boolean
  processing: boolean
  progress: number
  resultBlob: Blob | null
  sourceBlob: Blob | null
  tabValue: string
}

export type BackgroundRemoverAction =
  | { type: 'SET_BG_OPTION'; payload: BgOption }
  | { type: 'SET_CUSTOM_COLOR'; payload: string }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_DISPLAY_BLOB'; payload: Blob | null }
  | { type: 'SET_DOWNLOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_RESULT_BLOB'; payload: Blob | null }
  | { type: 'SET_SOURCE_BLOB'; payload: Blob | null }
  | { type: 'SET_TAB_VALUE'; payload: string }
  | { type: 'START_UPLOAD'; payload: { sourceBlob: Blob } }
  | { type: 'UPLOAD_SUCCESS'; payload: { resultBlob: Blob; displayBlob: Blob } }
  | { type: 'UPLOAD_FAILURE' }
  | { type: 'CONFIRM'; payload: { tabValue: string } }
  | { type: 'RESET' }
