export type State = {
  dialogOpen: boolean
  indent: number | 'tab'
  mode: 'beautify' | 'minify'
  result: string
  source: string
}

export type Action =
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_INDENT'; payload: number | 'tab' }
  | { type: 'SET_MODE'; payload: 'beautify' | 'minify' }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'SET_SOURCE'; payload: string }
  | { type: 'RESET' }
