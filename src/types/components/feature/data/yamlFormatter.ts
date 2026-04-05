export type State = {
  dialogOpen: boolean
  indent: number
  result: string
  sortKeys: boolean
  source: string
}

export type Action =
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_INDENT'; payload: number }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'SET_SORT_KEYS'; payload: boolean }
  | { type: 'SET_SOURCE'; payload: string }
  | { type: 'RESET' }
