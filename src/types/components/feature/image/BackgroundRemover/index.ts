export type BgOption = 'custom' | 'transparent' | 'white'

export type State = {
  bgOption: BgOption
  customColor: string
  dialogOpen: boolean
  displayUrl: string
  downloading: boolean
  error: boolean
  processing: boolean
  progress: number
  resultUrl: string
  sourcePreview: string
  tabValue: string
}

export type Action =
  | { type: 'SET_BG_OPTION'; payload: BgOption }
  | { type: 'SET_CUSTOM_COLOR'; payload: string }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_DISPLAY_URL'; payload: string }
  | { type: 'SET_DOWNLOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_RESULT_URL'; payload: string }
  | { type: 'SET_SOURCE_PREVIEW'; payload: string }
  | { type: 'SET_TAB_VALUE'; payload: string }
  | { type: 'START_UPLOAD'; payload: { sourcePreview: string } }
  | { type: 'UPLOAD_SUCCESS'; payload: { resultUrl: string; displayUrl: string } }
  | { type: 'UPLOAD_FAILURE' }
  | { type: 'CONFIRM'; payload: { tabValue: string } }
  | { type: 'RESET' }
